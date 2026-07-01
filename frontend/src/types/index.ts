// ─────────────────────────────────────────────────────────────────────────────
// User & Auth Types
// ─────────────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'client';

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  bio?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  timezone: string;
  lastLogin?: string;
  notifications: UserNotificationSettings;
  createdAt: string;
  updatedAt: string;
}

export interface UserNotificationSettings {
  email: boolean;
  push: boolean;
  taskAssigned: boolean;
  taskUpdated: boolean;
  projectUpdated: boolean;
  mentions: boolean;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role?: UserRole;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordData {
  password: string;
  confirmPassword: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Project Types
// ─────────────────────────────────────────────────────────────────────────────

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProjectMember {
  user: User | string;
  role: string;
  joinedAt: string;
}

export interface Milestone {
  _id: string;
  title: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  key: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  progress: number;
  projectManager: User | string;
  members: ProjectMember[];
  milestones: Milestone[];
  tags: string[];
  budget?: number;
  spent?: number;
  isArchived: boolean;
  createdBy: User | string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  name: string;
  key: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  projectManagerId?: string;
  memberIds?: string[];
  tags?: string[];
  budget?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Task Types
// ─────────────────────────────────────────────────────────────────────────────

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'testing' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ChecklistItem {
  _id: string;
  text: string;
  isCompleted: boolean;
  completedBy?: string;
  completedAt?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  project: Project | string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: Array<User | string>;
  reporter: User | string;
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  checklist: ChecklistItem[];
  subtasks: Task[];
  parentTask?: string;
  dependencies: string[];
  attachments: TaskAttachment[];
  watchers: string[];
  order: number;
  isArchived: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  _id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeIds?: string[];
  assignees?: string[];
  dueDate?: string;
  startDate?: string;
  estimatedHours?: number;
  labels?: string[];
  parentTaskId?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comment Types
// ─────────────────────────────────────────────────────────────────────────────

export interface Comment {
  _id: string;
  content: string;
  author: User;
  task?: string;
  project?: string;
  mentions: string[];
  attachments: TaskAttachment[];
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Notification Types
// ─────────────────────────────────────────────────────────────────────────────

export type NotificationType =
  | 'task_assigned'
  | 'task_updated'
  | 'task_completed'
  | 'project_updated'
  | 'comment_added'
  | 'mention'
  | 'deadline_reminder'
  | 'team_invite'
  | 'system';

export interface Notification {
  _id: string;
  recipient: string;
  sender?: User;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─────────────────────────────────────────────────────────────────────────────
// Time Tracking Types
// ─────────────────────────────────────────────────────────────────────────────

export interface TimeEntry {
  _id: string;
  task: Task | string;
  project: Project | string;
  user: User | string;
  description?: string;
  startTime: string;
  endTime?: string;
  duration?: number; // in minutes
  isManual: boolean;
  date: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard / Analytics Types
// ─────────────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalTasks: number;
  pendingTasks: number;
  completedTasks: number;
  overdueTasks: number;
  teamMembers: number;
  budgetUsage: number;
  totalTrackedHours: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface ActivityLog {
  _id: string;
  user: User;
  action: string;
  entity: string;
  entityId: string;
  details?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Form & UI Types
// ─────────────────────────────────────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface FilterOptions {
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  dateFrom?: string;
  dateTo?: string;
  tags?: string[];
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}
