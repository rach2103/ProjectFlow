import mongoose, { Schema, Document } from 'mongoose';

export type ExpenseCategory = 'software' | 'hardware' | 'travel' | 'consulting' | 'other';

export interface IExpense extends Document {
  project: mongoose.Types.ObjectId;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
  recordedBy: mongoose.Types.ObjectId;
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    project: { type: Schema.Types.ObjectId, ref: 'Project', required: true },
    amount: { type: Number, required: true, min: 0 },
    category: {
      type: String,
      enum: ['software', 'hardware', 'travel', 'consulting', 'other'],
      required: true,
      default: 'other',
    },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiptUrl: { type: String, trim: true },
  },
  {
    timestamps: true,
  }
);

// Indexes
ExpenseSchema.index({ project: 1 });
ExpenseSchema.index({ date: 1 });

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
