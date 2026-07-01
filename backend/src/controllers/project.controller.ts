import { Request, Response } from 'express';
import { Project } from '../models/Project.model';
import { Task } from '../models/Task.model';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { Notification } from '../models/Notification.model';
import { emitToUser } from '../sockets/socket.server';

/**
 * GET /api/projects
 * Retrieves all projects that the authenticated user is a member of.
 */
export const getAllProjects = async (req: Request, res: Response): Promise<void> => {
  const search = req.query.search as string;
  const status = req.query.status as string;
  const isArchived = req.query.isArchived === 'true';

  const query: Record<string, any> = { isArchived };

  // If user is not an admin, they can only see projects they belong to
  if (req.user!.role !== 'admin') {
    query['members.user'] = req.user!.userId;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { key: { $regex: search, $options: 'i' } },
    ];
  }

  if (status) {
    query.status = status;
  }

  const projects = await Project.find(query)
    .populate('projectManager', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar role')
    .sort({ createdAt: -1 });

  sendSuccess(res, 'Projects retrieved successfully', projects);
};

/**
 * GET /api/projects/:id
 * Retrieves a specific project by ID.
 */
export const getProjectById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const project = await Project.findById(id)
    .populate('projectManager', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar role')
    .populate('createdBy', 'firstName lastName email');

  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Permission check: admin or project member
  const isMember = project.members.some((m) => m.user._id.toString() === req.user!.userId);
  if (req.user!.role !== 'admin' && !isMember) {
    sendError(res, 'Access denied. You are not a member of this project.', 403);
    return;
  }

  sendSuccess(res, 'Project retrieved successfully', project);
};

/**
 * POST /api/projects
 * Creates a new project and sets the creator as a manager.
 */
export const createProject = async (req: Request, res: Response): Promise<void> => {
  const { name, description, key, status, priority, startDate, endDate, dueDate, budget, tags, milestones } = req.body;

  if (!name || !key) {
    sendError(res, 'Project name and key are required', 400);
    return;
  }

  // Check if key already exists
  const existingProject = await Project.findOne({ key: key.toUpperCase() });
  if (existingProject) {
    sendError(res, `A project with key "${key.toUpperCase()}" already exists`, 400);
    return;
  }

  const projectManagerId = req.body.projectManagerId || req.user!.userId;

  // Build members list, including the project manager and the creator
  const members = [{
    user: req.user!.userId,
    role: req.user!.role === 'admin' ? 'admin' : 'project_manager',
    joinedAt: new Date(),
  }];

  if (projectManagerId !== req.user!.userId) {
    members.push({
      user: projectManagerId,
      role: 'project_manager',
      joinedAt: new Date(),
    });
  }

  const project = new Project({
    name,
    description,
    key: key.toUpperCase(),
    status,
    priority,
    startDate,
    endDate,
    dueDate,
    projectManager: projectManagerId,
    members,
    tags,
    budget,
    milestones: milestones || [],
    createdBy: req.user!.userId,
  });

  await project.save();

  sendSuccess(res, 'Project created successfully', project, 201);
};

/**
 * PUT /api/projects/:id
 * Updates project settings (Admin or Project Manager only).
 */
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const project = await Project.findById(id);

  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Permission Check: must be Admin, project manager of this project, or the owner
  const isPM = project.projectManager.toString() === req.user!.userId ||
               project.members.some((m) => m.user.toString() === req.user!.userId && m.role === 'project_manager');

  if (req.user!.role !== 'admin' && !isPM) {
    sendError(res, 'Access denied. Only project managers can update this project.', 403);
    return;
  }

  const updatableFields = [
    'name',
    'description',
    'status',
    'priority',
    'startDate',
    'endDate',
    'dueDate',
    'budget',
    'tags',
    'milestones',
    'projectManager',
  ];

  updatableFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      (project as any)[field] = req.body[field];
    }
  });

  // Calculate project progress based on completed tasks
  const tasks = await Task.find({ project: id, isArchived: false });
  if (tasks.length > 0) {
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    project.progress = Math.round((completedTasks / tasks.length) * 100);
  }

  await project.save();

  // Populate manager & members before returning
  const updatedProject = await Project.findById(id)
    .populate('projectManager', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar role');

  sendSuccess(res, 'Project updated successfully', updatedProject);
};

/**
 * DELETE /api/projects/:id
 * Hard deletes or archives a project (Admin only).
 */
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (req.user!.role !== 'admin') {
    sendError(res, 'Access denied. Only administrators can delete projects.', 403);
    return;
  }

  const project = await Project.findByIdAndDelete(id);
  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Delete all tasks associated with this project
  await Task.deleteMany({ project: id });

  sendSuccess(res, 'Project and its tasks deleted successfully');
};

/**
 * POST /api/projects/:id/members
 * Adds a user to the project members.
 */
export const addProjectMember = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { userId, role } = req.body;

  if (!userId || !role) {
    sendError(res, 'User ID and role are required', 400);
    return;
  }

  const project = await Project.findById(id);
  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Permission Check
  const isPM = project.projectManager.toString() === req.user!.userId ||
               project.members.some((m) => m.user.toString() === req.user!.userId && m.role === 'project_manager');
  if (req.user!.role !== 'admin' && !isPM) {
    sendError(res, 'Access denied. You cannot manage project members.', 403);
    return;
  }

  // Check if user is already a member
  const alreadyMember = project.members.some((m) => m.user.toString() === userId);
  if (alreadyMember) {
    sendError(res, 'User is already a member of this project', 400);
    return;
  }

  project.members.push({
    user: userId,
    role,
    joinedAt: new Date(),
  });

  await project.save();

  // Create notifications
  const io = req.app.get('io');
  const notification = new Notification({
    recipient: userId,
    sender: req.user!.userId,
    type: 'project_updated',
    title: 'Added to Project',
    message: `You have been added to the project "${project.name}" as a ${role.replace('_', ' ')}.`,
    link: `/projects/${project._id}`,
  });
  await notification.save();

  if (io) {
    emitToUser(io, userId, 'notification', notification);
  }

  const updatedProject = await Project.findById(id)
    .populate('projectManager', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar role');

  sendSuccess(res, 'Member added to project successfully', updatedProject);
};

/**
 * DELETE /api/projects/:id/members/:userId
 * Removes a member from the project.
 */
export const removeProjectMember = async (req: Request, res: Response): Promise<void> => {
  const { id, userId } = req.params;

  const project = await Project.findById(id);
  if (!project) {
    sendError(res, 'Project not found', 404);
    return;
  }

  // Permission Check
  const isPM = project.projectManager.toString() === req.user!.userId ||
               project.members.some((m) => m.user.toString() === req.user!.userId && m.role === 'project_manager');
  if (req.user!.role !== 'admin' && !isPM) {
    sendError(res, 'Access denied. You cannot manage project members.', 403);
    return;
  }

  // Check if member exists
  const memberIndex = project.members.findIndex((m) => m.user.toString() === userId);
  if (memberIndex === -1) {
    sendError(res, 'Member not found in this project', 404);
    return;
  }

  // Cannot remove the main project manager
  if (project.projectManager.toString() === userId) {
    sendError(res, 'Cannot remove the primary Project Manager. Change project manager first.', 400);
    return;
  }

  project.members.splice(memberIndex, 1);
  await project.save();

  const updatedProject = await Project.findById(id)
    .populate('projectManager', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar role');

  sendSuccess(res, 'Member removed from project successfully', updatedProject);
};
