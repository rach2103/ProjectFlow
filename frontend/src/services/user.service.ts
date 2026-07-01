import api from './api';
import { User, ApiResponse } from '../types';

export const userService = {
  getAllUsers: async (params?: { search?: string; role?: string; page?: number; limit?: number }): Promise<User[]> => {
    const response = await api.get<ApiResponse<User[]>>('/users', { params });
    return response.data.data || [];
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data!;
  },

  updateUserRole: async (id: string, role: string): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}/role`, { role });
    return response.data.data!;
  },

  toggleUserStatus: async (id: string): Promise<void> => {
    await api.patch<ApiResponse>(`/users/${id}/status`);
  },
};
