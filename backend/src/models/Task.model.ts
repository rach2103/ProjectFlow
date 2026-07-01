import mongoose, { Schema, Document } from 'mongoose';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'testing' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface IChecklistItem {
  text: string;
  isCompleted: boolean;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
}

export interface ITaskAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface ITask extends Document {
  title: string;
  description?: string;
  project: mongoose.Types.ObjectId;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: mongoose.Types.ObjectId[];
  reporter: mongoose.Types.ObjectId;
  dueDate?: Date;
  startDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  labels: string[];
  checklist: IChecklistItem[];
  parentTask?: mongoose.Types.ObjectId; // For subtasks
  dependencies: mongoose.Types.ObjectId[];
  attachments: ITaskAttachment[];
  watchers: mongoose.Types.ObjectId[];
  order: number;
  isArchived: boolean;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema({
  text: { type: String, required: true, trim: true },
  isCompleted: { type: Boolean, default: false },
  completedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  completedAt: { type: Date },
});

const TaskAttachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const TaskSchema = new Schema<ITask>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'review', 'testing', 'completed'],
      default: 'todo',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    assignees: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    dueDate: { type: Date },
    startDate: { type: Date },
    estimatedHours: { type: Number, default: 0 },
    actualHours: { type: Number, default: 0 },
    labels: [{ type: String, default: [] }],
    checklist: { type: [ChecklistItemSchema], default: [] },
    parentTask: { type: Schema.Types.ObjectId, ref: 'Task' },
    dependencies: [{ type: Schema.Types.ObjectId, ref: 'Task', default: [] }],
    attachments: { type: [TaskAttachmentSchema], default: [] },
    watchers: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    order: { type: Number, default: 0 },
    isArchived: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
TaskSchema.index({ project: 1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ assignees: 1 });
TaskSchema.index({ order: 1 });

export const Task = mongoose.model<ITask>('Task', TaskSchema);
