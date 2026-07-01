import { Request, Response } from 'express';
import { Task } from '../models/Task.model';
import { Project } from '../models/Project.model';
import { sendSuccess } from '../utils/apiResponse';

/**
 * GET /api/documents
 * Lists task attachments visible to the authenticated user.
 */
export const getDocuments = async (req: Request, res: Response): Promise<void> => {
  const { projectId, taskId, search } = req.query;

  const query: Record<string, any> = {
    isArchived: false,
    'attachments.0': { $exists: true },
  };

  if (taskId) {
    query._id = taskId;
  }

  if (projectId) {
    query.project = projectId;
  } else if (req.user!.role !== 'admin') {
    const userProjects = await Project.find({ 'members.user': req.user!.userId }).select('_id');
    query.project = { $in: userProjects.map((project) => project._id) };
  }

  const tasks = await Task.find(query)
    .populate('project', 'name key')
    .populate('attachments.uploadedBy', 'firstName lastName email avatar')
    .select('title project attachments')
    .sort({ updatedAt: -1 });

  const searchText = typeof search === 'string' ? search.toLowerCase() : '';
  const documents = tasks.flatMap((task) => {
    const taskObj = task.toObject() as any;
    return taskObj.attachments
      .filter((attachment: any) => {
        if (!searchText) return true;
        return (
          attachment.name?.toLowerCase().includes(searchText) ||
          taskObj.title?.toLowerCase().includes(searchText) ||
          taskObj.project?.name?.toLowerCase().includes(searchText)
        );
      })
      .map((attachment: any) => ({
        _id: attachment._id,
        name: attachment.name,
        url: attachment.url,
        size: attachment.size,
        type: attachment.type,
        uploadedAt: attachment.uploadedAt,
        uploadedBy: attachment.uploadedBy,
        task: {
          _id: taskObj._id,
          title: taskObj.title,
        },
        project: taskObj.project,
      }));
  });

  documents.sort((a: any, b: any) => {
    const aTime = new Date(a.uploadedAt || 0).getTime();
    const bTime = new Date(b.uploadedAt || 0).getTime();
    return bTime - aTime;
  });

  sendSuccess(res, 'Documents retrieved successfully', documents);
};
