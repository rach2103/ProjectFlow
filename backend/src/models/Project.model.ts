import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from './User.model';

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'archived' | 'cancelled';
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IMilestone {
  title: string;
  description?: string;
  dueDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
}

export interface IProjectMember {
  user: mongoose.Types.ObjectId;
  role: UserRole;
  joinedAt: Date;
}

export interface IProject extends Document {
  name: string;
  description?: string;
  key: string; // e.g. "PMS"
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: Date;
  endDate?: Date;
  dueDate?: Date;
  progress: number;
  projectManager: mongoose.Types.ObjectId;
  members: IProjectMember[];
  milestones: IMilestone[];
  tags: string[];
  budget?: number;
  spent?: number;
  isArchived: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MilestoneSchema = new Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  dueDate: { type: Date, required: true },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
});

const ProjectMemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: {
    type: String,
    enum: ['admin', 'project_manager', 'team_lead', 'developer', 'client'],
    required: true,
  },
  joinedAt: { type: Date, default: Date.now },
});

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    key: { type: String, required: true, uppercase: true, trim: true },
    status: {
      type: String,
      enum: ['planning', 'active', 'on_hold', 'completed', 'archived', 'cancelled'],
      default: 'planning',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    startDate: { type: Date },
    endDate: { type: Date },
    dueDate: { type: Date },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    projectManager: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: { type: [ProjectMemberSchema], default: [] },
    milestones: { type: [MilestoneSchema], default: [] },
    tags: { type: [String], default: [] },
    budget: { type: Number, default: 0 },
    spent: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
ProjectSchema.index({ name: 1 });
ProjectSchema.index({ key: 1 }, { unique: true });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ projectManager: 1 });

export const Project = mongoose.model<IProject>('Project', ProjectSchema);
