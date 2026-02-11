import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITask extends Document {
  taskId: string;
  workspaceId?: string;
  projectId?: string;
  milestoneId?: string;
  taskName: string;
  taskDescription?: string;
  priority?: string;
  startDate?: Date;
  dueDate?: Date;
  assignee?: string;
  collaborator?: string;
  status?: string;
  createdBy?: string;
  createdDate?: Date;
  completedBy?: string;
  completionDate?: Date;

  // ── Enhanced fields for Planzo PM ──────────────────────────────
  tags?: string[];
  progress?: number;               // 0-100
  timeLogged?: number;             // hours
  approvalStatus?: string;         // pending | approved | rejected | none
  reviewer?: string;
  isBlocked?: boolean;
  blockerNotes?: string;
  isRecurring?: boolean;
  recurringPattern?: string;       // daily | weekly | monthly | quarterly | yearly | custom
  recurringInterval?: number;      // e.g. every 2 weeks
  recurringEndDate?: Date;
  parentTaskId?: string;           // for recurring task instances
  attachments?: string[];
  completedOnTime?: boolean;
  managerScore?: number;           // 1-5 quality score
  estimatedHours?: number;
  calendarEventId?: string;        // Google Calendar link
}

const TaskSchema: Schema = new Schema({
  taskId: { type: String, required: true, unique: true },
  workspaceId: { type: String, index: true },
  projectId: { type: String, index: true },
  milestoneId: { type: String, index: true },
  taskName: { type: String, required: true },
  taskDescription: { type: String },
  priority: { type: String },
  startDate: { type: Date },
  dueDate: { type: Date },
  assignee: { type: String, index: true },
  collaborator: { type: String },
  status: { type: String, default: 'Not Started', index: true },
  createdBy: { type: String },
  createdDate: { type: Date },
  completedBy: { type: String },
  completionDate: { type: Date },

  // Enhanced fields
  tags: [{ type: String }],
  progress: { type: Number, default: 0, min: 0, max: 100 },
  timeLogged: { type: Number, default: 0 },
  approvalStatus: { type: String, default: 'none', enum: ['none', 'pending', 'approved', 'rejected'] },
  reviewer: { type: String },
  isBlocked: { type: Boolean, default: false },
  blockerNotes: { type: String },
  isRecurring: { type: Boolean, default: false },
  recurringPattern: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom', null] },
  recurringInterval: { type: Number },
  recurringEndDate: { type: Date },
  parentTaskId: { type: String },
  attachments: [{ type: String }],
  completedOnTime: { type: Boolean },
  managerScore: { type: Number, min: 1, max: 5 },
  estimatedHours: { type: Number },
  calendarEventId: { type: String },
}, { timestamps: true, collection: 'planzoTasks' });

// Compound indexes for common queries
TaskSchema.index({ workspaceId: 1, status: 1 });
TaskSchema.index({ assignee: 1, status: 1 });
TaskSchema.index({ projectId: 1, status: 1 });
TaskSchema.index({ dueDate: 1, status: 1 });

const Task: Model<ITask> = mongoose.models.Task || mongoose.model<ITask>('Task', TaskSchema);

export default Task;
