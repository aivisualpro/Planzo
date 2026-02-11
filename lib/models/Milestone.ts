import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IMilestone extends Document {
  milestoneId: string;
  milestoneName: string;
  workspaceId?: string;
  projectId?: string;
  dueDate?: Date;
  notes?: string;
  photoDrop?: string;
  status?: string;
  createdBy?: string;
  createdDate?: Date;
  completedBy?: string;
  completionDate?: Date;
  progress?: number;
  owner?: string;
}

const MilestoneSchema: Schema = new Schema({
  milestoneId: { type: String, required: true, unique: true },
  milestoneName: { type: String, required: true },
  workspaceId: { type: String, index: true },
  projectId: { type: String, index: true },
  dueDate: { type: Date },
  notes: { type: String },
  photoDrop: { type: String },
  status: { type: String, default: 'Not Started' },
  createdBy: { type: String },
  createdDate: { type: Date },
  completedBy: { type: String },
  completionDate: { type: Date },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  owner: { type: String },
}, { timestamps: true, collection: 'planzoMilestones' });

const Milestone: Model<IMilestone> = mongoose.models.Milestone || mongoose.model<IMilestone>('Milestone', MilestoneSchema);

export default Milestone;
