import { Request, Response } from 'express';
import { Task, TaskStatus } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { Notification } from '../models/Notification.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { emitToUser, emitToProject } from '../sockets/socket.server';
import mongoose from 'mongoose';

/**
 * GET /api/tasks
 * Retrieves all tasks with filtering, sorting, and pagination.
 */
export const getAllTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId, status, priority, assigneeId, search } = req.query;

  const query: Record<string, any> = { isArchived: false };

  if (projectId) {
    query.project = projectId;
  } else {
    // If no project specified, only return tasks from user's projects
    if (req.user!.role !== 'admin') {
      const userProjects = await Project.find({ 'members.user': req.user!.userId }).select('_id');
      query.project = { $in: userProjects.map((p) => p._id) };
    }
  }

  if (status) {
    query.status = status;
  }

  if (priority) {
    query.priority = priority;
  }

  if (assigneeId) {
    query.assignees = assigneeId;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const tasks = await Task.find(query)
    .populate('assignees', 'firstName lastName email avatar role')
    .populate('reporter', 'firstName lastName email avatar')
    .populate('project', 'name key')
    .sort({ order: 1, createdAt: -1 });

  sendSuccess(res, 'Tasks retrieved successfully', tasks);
};

/**
 * GET /api/tasks/:id
 * Retrieves a specific task by ID.
 */
export const getTaskById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const task = await Task.findById(id)
    .populate('assignees', 'firstName lastName email avatar role')
    .populate('reporter', 'firstName lastName email avatar')
    .populate('project', 'name key members')
    .populate('dependencies', 'title status priority')
    .populate({
      path: 'parentTask',
      select: 'title status',
    });

  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  // Find subtasks
  const subtasks = await Task.find({ parentTask: id, isArchived: false })
    .populate('assignees', 'firstName lastName email avatar');

  const taskObj = task.toJSON() as any;
  taskObj.subtasks = subtasks;

  sendSuccess(res, 'Task retrieved successfully', taskObj);
};

/**
 * POST /api/tasks
 * Creates a new task.
 */
export const createTask = async (req: Request, res: Response): Promise<void> => {
  const { title, description, projectId, status, priority, dueDate, startDate, estimatedHours, labels, parentTaskId } = req.body;
  const assignees = req.body.assignees || req.body.assigneeIds || [];

  if (!title || !projectId) {
    sendError(res, 'Task title and project ID are required', 400);
    return;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Get order number (place at end of the status column)
  const taskCountInStatus = await Task.countDocuments({ project: projectId, status: status || 'todo', isArchived: false });

  const task = new Task({
    title,
    description,
    project: projectId,
    status: status || 'todo',
    priority: priority || 'medium',
    assignees: assignees || [],
    reporter: req.user!.userId,
    dueDate,
    startDate,
    estimatedHours: estimatedHours || 0,
    labels: labels || [],
    parentTask: parentTaskId || undefined,
    order: taskCountInStatus,
  });

  await task.save();

  // Trigger Notifications for assignees
  const io = req.app.get('io');
  if (assignees && assignees.length > 0) {
    const notifyPromises = assignees.map(async (assigneeId: string) => {
      if (assigneeId === req.user!.userId) return; // don't notify self

      const notification = new Notification({
        recipient: assigneeId,
        sender: req.user!.userId,
        type: 'task_assigned',
        title: 'New Task Assigned',
        message: `You have been assigned to the task "${title}" in project "${project.name}".`,
        link: `/tasks/${task._id}`,
      });
      await notification.save();

      if (io) {
        emitToUser(io, assigneeId, 'notification', notification);
      }
    });

    await Promise.all(notifyPromises);
  }

  // Broadcast task:created to the project room
  if (io) {
    emitToProject(io, projectId, 'task:created', task);
  }

  sendSuccess(res, 'Task created successfully', task, 201);
};

/**
 * PUT /api/tasks/:id
 * Updates a task.
 */
export const updateTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const task = await Task.findById(id);

  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  const originalStatus = task.status;
  const updatableFields = [
    'title',
    'description',
    'status',
    'priority',
    'assignees',
    'dueDate',
    'startDate',
    'estimatedHours',
    'actualHours',
    'labels',
    'parentTask',
    'dependencies',
    'checklist',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      (task as any)[field] = req.body[field];
    }
  });

  // Set completedAt if status changes to completed
  if (task.status === 'completed' && originalStatus !== 'completed') {
    task.completedAt = new Date();
  } else if (task.status !== 'completed') {
    task.completedAt = undefined;
  }

  await task.save();

  // Trigger notification if assignee or status changed
  const io = req.app.get('io');
  if (io) {
    emitToProject(io, task.project.toString(), 'task:updated', task);
  }

  // Recalculate project progress
  const project = await Project.findById(task.project);
  if (project) {
    const projectTasks = await Task.find({ project: project._id, isArchived: false });
    if (projectTasks.length > 0) {
      const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
      project.progress = Math.round((completedCount / projectTasks.length) * 100);
      await project.save();
    }
  }

  const updatedTask = await Task.findById(id)
    .populate('assignees', 'firstName lastName email avatar role')
    .populate('reporter', 'firstName lastName email avatar');

  sendSuccess(res, 'Task updated successfully', updatedTask);
};

/**
 * PATCH /api/tasks/reorder
 * Handles Kanban column drag & drop reordering.
 */
export const reorderTasks = async (req: Request, res: Response): Promise<void> => {
  const { tasks } = req.body; // Array of { _id: string, order: number, status: string }

  if (!tasks || !Array.isArray(tasks)) {
    sendError(res, 'Tasks array is required for reordering', 400);
    return;
  }

  const io = req.app.get('io');
  let projectId: string | null = null;

  const bulkOps = tasks.map((t: any) => {
    return {
      updateOne: {
        filter: { _id: new mongoose.Types.ObjectId(t._id) },
        update: {
          $set: {
            order: t.order,
            status: t.status as TaskStatus,
            completedAt: t.status === 'completed' ? new Date() : undefined,
          },
        },
      },
    };
  });

  await Task.bulkWrite(bulkOps);

  // Trigger project update
  const sampleTask = await Task.findById(tasks[0]?._id);
  if (sampleTask) {
    projectId = sampleTask.project.toString();
    if (io && projectId) {
      emitToProject(io, projectId, 'tasks:reordered', { projectId });
    }

    // Recalculate project progress
    const project = await Project.findById(projectId);
    if (project) {
      const projectTasks = await Task.find({ project: project._id, isArchived: false });
      if (projectTasks.length > 0) {
        const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
        project.progress = Math.round((completedCount / projectTasks.length) * 100);
        await project.save();
      }
    }
  }

  sendSuccess(res, 'Tasks reordered successfully');
};

/**
 * DELETE /api/tasks/:id
 * Archives a task.
 */
export const deleteTask = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const task = await Task.findById(id);
  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  task.isArchived = true;
  await task.save();

  // Recalculate project progress
  const project = await Project.findById(task.project);
  if (project) {
    const projectTasks = await Task.find({ project: project._id, isArchived: false });
    if (projectTasks.length > 0) {
      const completedCount = projectTasks.filter((t) => t.status === 'completed').length;
      project.progress = Math.round((completedCount / projectTasks.length) * 100);
    } else {
      project.progress = 0;
    }
    await project.save();
  }

  const io = req.app.get('io');
  if (io) {
    emitToProject(io, task.project.toString(), 'task:deleted', { id });
  }

  sendSuccess(res, 'Task archived successfully');
};

/**
 * POST /api/tasks/:id/attachments
 * Uploads an attachment to a task. Fallback to local storage path.
 */
export const uploadAttachment = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.file) {
    sendError(res, 'No file provided', 400);
    return;
  }

  const task = await Task.findById(id);
  if (!task) {
    sendError(res, 'Task not found', 404);
    return;
  }

  // Build the static file link served by the backend
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

  const attachment = {
    name: req.file.originalname,
    url: fileUrl,
    size: req.file.size,
    type: req.file.mimetype,
    uploadedBy: new mongoose.Types.ObjectId(req.user!.userId),
    uploadedAt: new Date(),
  };

  task.attachments.push(attachment as any);
  await task.save();

  sendSuccess(res, 'Attachment uploaded successfully', task);
};
