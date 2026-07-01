import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeLog extends Document {
  task: mongoose.Types.ObjectId;
  project: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  isManual: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TimeLogSchema = new Schema<ITimeLog>(
  {
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, trim: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // duration in minutes
    isManual: { type: Boolean, default: false },
    date: { type: Date, required: true, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Indexes
TimeLogSchema.index({ task: 1 });
TimeLogSchema.index({ project: 1 });
TimeLogSchema.index({ user: 1 });
TimeLogSchema.index({ date: 1 });

export const TimeLog = mongoose.model<ITimeLog>('TimeLog', TimeLogSchema);
