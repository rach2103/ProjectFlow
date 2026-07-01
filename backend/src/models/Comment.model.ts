import mongoose, { Schema, Document } from 'mongoose';

export interface ICommentAttachment {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedBy: mongoose.Types.ObjectId;
}

export interface IComment extends Document {
  content: string;
  author: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  project?: mongoose.Types.ObjectId;
  mentions: mongoose.Types.ObjectId[];
  attachments: ICommentAttachment[];
  isEdited: boolean;
  editedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CommentAttachmentSchema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  type: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const CommentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    task: { type: Schema.Types.ObjectId, ref: 'Task' },
    project: { type: Schema.Types.ObjectId, ref: 'Project' },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User', default: [] }],
    attachments: { type: [CommentAttachmentSchema], default: [] },
    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Indexes
CommentSchema.index({ task: 1 });
CommentSchema.index({ project: 1 });
CommentSchema.index({ author: 1 });

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
