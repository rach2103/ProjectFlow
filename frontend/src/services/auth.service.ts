import api from './api';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
  ChangePasswordData,
  ResetPasswordData,
  ApiResponse,
} from '../types';

/**
 * Authentication API service — wraps all auth-related API calls.
 */
export const authService = {
  /**
   * Registers a new user account.
   */
  register: async (data: RegisterData): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Logs in with email and password.
   * Stores tokens in localStorage on success.
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    const { accessToken, refreshToken, user } = response.data.data!;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return { accessToken, refreshToken, user };
  },

  /**
   * Logs out the current user and clears stored tokens.
   */
  logout: async (): Promise<void> => {
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => {});
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  /**
   * Refreshes the access token using the stored refresh token.
   */
  refreshToken: async (): Promise<{ accessToken: string; refreshToken: string }> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const response = await api.post<ApiResponse>('/auth/refresh', { refreshToken });
    const tokens = response.data.data;
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    return tokens;
  },

  /**
   * Returns the currently authenticated user.
   */
  getMe: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data!;
  },

  /**
   * Sends a password reset email.
   */
  forgotPassword: async (email: string): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  /**
   * Resets password using the token from the reset email.
   */
  resetPassword: async (token: string, data: ResetPasswordData): Promise<ApiResponse> => {
    const response = await api.patch<ApiResponse>(`/auth/reset-password/${token}`, data);
    return response.data;
  },

  /**
   * Changes password for an authenticated user.
   */
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse> => {
    const response = await api.patch<ApiResponse>('/auth/change-password', data);
    return response.data;
  },

  /**
   * Verifies email using token from verification email.
   */
  verifyEmail: async (token: string): Promise<ApiResponse> => {
    const response = await api.get<ApiResponse>(`/auth/verify-email/${token}`);
    return response.data;
  },

  /**
   * Resends email verification to the current user's email.
   */
  resendVerification: async (): Promise<ApiResponse> => {
    const response = await api.post<ApiResponse>('/auth/resend-verification');
    return response.data;
  },
};
