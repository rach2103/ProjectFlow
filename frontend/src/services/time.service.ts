import api from './api';
import { TimeEntry, ApiResponse } from '../types';

export const timeService = {
  getTimeLogs: async (params?: {
    projectId?: string;
    taskId?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<TimeEntry[]> => {
    const response = await api.get<ApiResponse<TimeEntry[]>>('/time-logs', { params });
    return response.data.data || [];
  },

  getActiveTimer: async (): Promise<TimeEntry | null> => {
    const response = await api.get<ApiResponse<TimeEntry | null>>('/time-logs/active');
    return response.data.data || null;
  },

  startTimer: async (taskId: string, description?: string): Promise<TimeEntry> => {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-logs/start', { taskId, description });
    return response.data.data!;
  },

  stopTimer: async (): Promise<TimeEntry> => {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-logs/stop');
    return response.data.data!;
  },

  logTimeManually: async (data: {
    taskId: string;
    description?: string;
    date: string;
    hours: number;
  }): Promise<TimeEntry> => {
    const response = await api.post<ApiResponse<TimeEntry>>('/time-logs/manual', data);
    return response.data.data!;
  },

  deleteTimeLog: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/time-logs/${id}`);
  },
};
