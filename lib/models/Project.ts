import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  workspaceId?: string;
  projectName: string;
  projectDescription?: string;
  startDate?: Date;
  endDate?: Date;
  assignee?: string;
  projectMembers?: string[];
  priorityLevel?: string;
  status?: string;
  createdBy?: string;
  createdDate?: Date;
  completedBy?: string;
  completionDate?: Date;

  // ── Enhanced fields for Planzo PM ──────────────────────────────
  progress?: number;               // 0-100
  notes?: string;                  // PM notes
  attachments?: string[];          // docs, briefs, references
  risks?: string[];                // open risks
  budgetHours?: number;            // capacity planning
  actualHours?: number;            // actual time spent
  tags?: string[];
  color?: string;                  // project color in UI
}

const ProjectSchema: Schema = new Schema({
  projectId: { type: String, required: true, unique: true },
  workspaceId: { type: String, index: true },
  projectName: { type: String, required: true },
  projectDescription: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  assignee: { type: String },
  projectMembers: [{ type: String }],
  priorityLevel: { type: String },
  status: { type: String, default: 'Not Started' },
  createdBy: { type: String },
  createdDate: { type: Date },
  completedBy: { type: String },
  completionDate: { type: Date },

  // Enhanced fields
  progress: { type: Number, default: 0, min: 0, max: 100 },
  notes: { type: String },
  attachments: [{ type: String }],
  risks: [{ type: String }],
  budgetHours: { type: Number },
  actualHours: { type: Number },
  tags: [{ type: String }],
  color: { type: String },
}, { timestamps: true, collection: 'planzoProjects' });

ProjectSchema.index({ workspaceId: 1, status: 1 });

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);

export default Project;
