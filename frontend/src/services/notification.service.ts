import api from './api';
import { Notification, ApiResponse } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await api.get<ApiResponse<Notification[]>>('/notifications');
    return response.data.data || [];
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`);
    return response.data.data!;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch<ApiResponse>('/notifications/read-all');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/notifications/${id}`);
  },

  clearAllNotifications: async (): Promise<void> => {
    await api.delete<ApiResponse>('/notifications');
  },
};
