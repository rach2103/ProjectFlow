import api from './api';
import { ApiResponse, Project, Task, TaskAttachment, User } from '../types';

export interface DocumentItem extends Omit<TaskAttachment, 'uploadedBy'> {
  task: Pick<Task, '_id' | 'title'>;
  project: Pick<Project, '_id' | 'name' | 'key'>;
  uploadedBy: User | string;
}

export const documentService = {
  getDocuments: async (params?: {
    projectId?: string;
    taskId?: string;
    search?: string;
  }): Promise<DocumentItem[]> => {
    const response = await api.get<ApiResponse<DocumentItem[]>>('/documents', { params });
    return response.data.data || [];
  },
};
