import api from './api';
import { Comment, ApiResponse } from '../types';

export const collaborationService = {
  getCommentsByTask: async (taskId: string): Promise<Comment[]> => {
    const response = await api.get<ApiResponse<Comment[]>>(`/comments/task/${taskId}`);
    return response.data.data || [];
  },

  addComment: async (taskId: string, content: string, mentions?: string[]): Promise<Comment> => {
    const response = await api.post<ApiResponse<Comment>>('/comments', { taskId, content, mentions });
    return response.data.data!;
  },

  deleteComment: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/comments/${id}`);
  },
};
