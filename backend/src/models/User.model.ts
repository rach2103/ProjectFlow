import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// All supported roles in the system
export type UserRole = 'admin' | 'project_manager' | 'team_lead' | 'developer' | 'client';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
  avatar?: string;
  avatarPublicId?: string;
  isEmailVerified: boolean;
  isActive: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockUntil?: Date;
  bio?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    taskAssigned: boolean;
    taskUpdated: boolean;
    projectUpdated: boolean;
    mentions: boolean;
  };
  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
  getFullName(): string;
}

const NotificationSchema = new Schema(
  {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    taskAssigned: { type: Boolean, default: true },
    taskUpdated: { type: Boolean, default: true },
    projectUpdated: { type: Boolean, default: true },
    mentions: { type: Boolean, default: true },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password in queries
    },
    role: {
      type: String,
      enum: ['admin', 'project_manager', 'team_lead', 'developer', 'client'],
      default: 'developer',
    },
    avatar: { type: String, default: null },
    avatarPublicId: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    refreshToken: { type: String, select: false },
    lastLogin: { type: Date },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    bio: { type: String, maxlength: [500, 'Bio cannot exceed 500 characters'] },
    phone: { type: String, trim: true },
    department: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    timezone: { type: String, default: 'UTC' },
    notifications: { type: NotificationSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const sanitized = ret as Record<string, unknown>;

        // Remove sensitive fields from JSON output
        delete sanitized.password;
        delete sanitized.refreshToken;
        delete sanitized.emailVerificationToken;
        delete sanitized.emailVerificationExpires;
        delete sanitized.passwordResetToken;
        delete sanitized.passwordResetExpires;
        delete sanitized.loginAttempts;
        delete sanitized.lockUntil;
        delete sanitized.__v;
        return ret;
      },
    },
  }
);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

/**
 * Hash password before saving if it was modified.
 */
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compares a plain text password with the hashed password.
 */
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Checks if the account is currently locked due to too many failed login attempts.
 */
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

/**
 * Increments failed login attempts and locks account if threshold exceeded.
 */
UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const MAX_ATTEMPTS = 5;
  const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  // Reset attempts if previous lock has expired
  if (this.lockUntil && this.lockUntil < new Date()) {
    this.loginAttempts = 1;
    this.lockUntil = undefined;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= MAX_ATTEMPTS && !this.isLocked()) {
      this.lockUntil = new Date(Date.now() + LOCK_DURATION);
    }
  }
  await this.save();
};

/**
 * Resets login attempts and removes the lock after successful login.
 */
UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = undefined;
  await this.save();
};

/**
 * Returns the user's full name.
 */
UserSchema.methods.getFullName = function (): string {
  return `${this.firstName} ${this.lastName}`;
};

export const User = mongoose.model<IUser>('User', UserSchema);
