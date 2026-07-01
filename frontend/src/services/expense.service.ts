import api from './api';
import { ApiResponse } from '../types';

export interface Expense {
  _id: string;
  project: string;
  amount: number;
  category: 'software' | 'hardware' | 'travel' | 'consulting' | 'other';
  description: string;
  date: string;
  recordedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
}

export const expenseService = {
  getExpensesByProject: async (projectId: string): Promise<Expense[]> => {
    const response = await api.get<ApiResponse<Expense[]>>(`/expenses/project/${projectId}`);
    return response.data.data || [];
  },

  addExpense: async (data: {
    projectId: string;
    amount: number;
    category: string;
    description: string;
    date?: string;
  }): Promise<Expense> => {
    const response = await api.post<ApiResponse<Expense>>('/expenses', data);
    return response.data.data!;
  },

  deleteExpense: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/expenses/${id}`);
  },
};
