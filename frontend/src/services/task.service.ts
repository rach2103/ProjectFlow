import api from './api';
import { Task, CreateTaskData, ApiResponse } from '../types';

export const taskService = {
  getAllTasks: async (params?: {
    projectId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    search?: string;
  }): Promise<Task[]> => {
    const response = await api.get<ApiResponse<Task[]>>('/tasks', { params });
    return response.data.data || [];
  },

  getTaskById: async (id: string): Promise<Task & { subtasks: Task[] }> => {
    const response = await api.get<ApiResponse<Task & { subtasks: Task[] }>>(`/tasks/${id}`);
    return response.data.data!;
  },

  createTask: async (data: CreateTaskData): Promise<Task> => {
    const { assigneeIds, ...rest } = data;
    const payload = {
      ...rest,
      assignees: data.assignees || assigneeIds || [],
    };
    const response = await api.post<ApiResponse<Task>>('/tasks', payload);
    return response.data.data!;
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const response = await api.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data!;
  },

  deleteTask: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/tasks/${id}`);
  },

  reorderTasks: async (tasks: Array<{ _id: string; order: number; status: string }>): Promise<void> => {
    await api.patch<ApiResponse>('/tasks/reorder', { tasks });
  },

  uploadAttachment: async (taskId: string, file: File): Promise<Task> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<ApiResponse<Task>>(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data!;
  },
};
