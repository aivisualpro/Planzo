import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkspace extends Document {
  workspaceId: string;
  workspaceTeam: string;
  workspaceDescription?: string;
  teamMembers?: string[];
  image?: string;
  colorType?: string;
  isDeleted: boolean;
  createdBy?: string;
  dateCreated?: Date;
}

const WorkspaceSchema: Schema = new Schema({
  workspaceId: { type: String, required: true, unique: true },
  workspaceTeam: { type: String, required: true },
  workspaceDescription: { type: String },
  teamMembers: [{ type: String }],
  image: { type: String },
  colorType: { type: String },
  isDeleted: { type: Boolean, default: false },
  createdBy: { type: String },
  dateCreated: { type: Date },
}, { timestamps: true, collection: 'planzoWorkspaces' });

const Workspace: Model<IWorkspace> = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

export default Workspace;
