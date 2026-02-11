import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAuditTrail extends Document {
  eventId: string;
  workspaceId?: string;
  projectId?: string;
  projectName?: string;
  taskId?: string;
  taskName?: string;
  milestoneId?: string;
  milestoneName?: string;
  eventType: string;         // task_created | task_updated | task_deleted | status_changed | assignment_changed | approval_requested | approval_completed | project_created | project_updated | milestone_created | milestone_updated | comment_added | time_logged | blocker_flagged | dependency_added
  description: string;       // human-readable description
  performedBy: string;       // userId or email
  performedByName?: string;
  oldValue?: string;
  newValue?: string;
  field?: string;            // which field was changed
  ipAddress?: string;
  userAgent?: string;
  createdAt?: Date;
}

const AuditTrailSchema: Schema = new Schema({
  eventId: { type: String, required: true, unique: true },
  workspaceId: { type: String, index: true },
  projectId: { type: String, index: true },
  projectName: { type: String },
  taskId: { type: String, index: true },
  taskName: { type: String },
  milestoneId: { type: String },
  milestoneName: { type: String },
  eventType: { 
    type: String, 
    required: true,
    index: true,
    enum: [
      'task_created', 'task_updated', 'task_deleted',
      'status_changed', 'assignment_changed',
      'approval_requested', 'approval_completed',
      'project_created', 'project_updated', 'project_deleted',
      'milestone_created', 'milestone_updated',
      'comment_added', 'time_logged',
      'blocker_flagged', 'blocker_resolved',
      'dependency_added', 'dependency_removed',
      'score_given', 'attachment_added',
      'member_added', 'member_removed',
    ] 
  },
  description: { type: String, required: true },
  performedBy: { type: String, required: true, index: true },
  performedByName: { type: String },
  oldValue: { type: String },
  newValue: { type: String },
  field: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
}, { timestamps: true, collection: 'planzoAuditTrail' });

AuditTrailSchema.index({ createdAt: -1 });
AuditTrailSchema.index({ eventType: 1, createdAt: -1 });
AuditTrailSchema.index({ performedBy: 1, createdAt: -1 });

const AuditTrail: Model<IAuditTrail> = mongoose.models.AuditTrail || mongoose.model<IAuditTrail>('AuditTrail', AuditTrailSchema);

export default AuditTrail;
