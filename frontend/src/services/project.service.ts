import api from './api';
import { Project, CreateProjectData, ApiResponse } from '../types';

export const projectService = {
  getAllProjects: async (params?: { search?: string; status?: string; isArchived?: boolean }): Promise<Project[]> => {
    const response = await api.get<ApiResponse<Project[]>>('/projects', { params });
    return response.data.data || [];
  },

  getProjectById: async (id: string): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data.data!;
  },

  createProject: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>('/projects', data);
    return response.data.data!;
  },

  updateProject: async (id: string, data: Partial<CreateProjectData>): Promise<Project> => {
    const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, data);
    return response.data.data!;
  },

  deleteProject: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/projects/${id}`);
  },

  addProjectMember: async (projectId: string, userId: string, role: string): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>(`/projects/${projectId}/members`, { userId, role });
    return response.data.data!;
  },

  removeProjectMember: async (projectId: string, userId: string): Promise<Project> => {
    const response = await api.delete<ApiResponse<Project>>(`/projects/${projectId}/members/${userId}`);
    return response.data.data!;
  },
};
