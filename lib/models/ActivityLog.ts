import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivityLog extends Document {
  activityId: string;
  workspaceId?: string;
  projectId?: string;
  taskId?: string;
  milestoneId?: string;
  type: string;          // comment | note | status_change | assignment | attachment | score | approval | blocker
  action: string;        // e.g. "changed status from In Progress to For Review"
  content?: string;      // comment/note text
  author: string;        // who performed the action
  authorName?: string;
  metadata?: any;        // additional context (old/new values, etc.)
  createdAt?: Date;
}

const ActivityLogSchema: Schema = new Schema({
  activityId: { type: String, required: true, unique: true },
  workspaceId: { type: String, index: true },
  projectId: { type: String, index: true },
  taskId: { type: String, index: true },
  milestoneId: { type: String },
  type: { 
    type: String, 
    required: true, 
    enum: ['comment', 'note', 'status_change', 'assignment', 'attachment', 'score', 'approval', 'blocker', 'other'],
    index: true 
  },
  action: { type: String, required: true },
  content: { type: String },
  author: { type: String, required: true, index: true },
  authorName: { type: String },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true, collection: 'planzoActivityLogs' });

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ author: 1, createdAt: -1 });
ActivityLogSchema.index({ taskId: 1, createdAt: -1 });

const ActivityLog: Model<IActivityLog> = mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;
