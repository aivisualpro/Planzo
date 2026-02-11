import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITimeLog extends Document {
  timeLogId: string;
  workspaceId?: string;
  projectId?: string;
  taskId: string;
  userId: string;
  userName?: string;
  date: Date;
  hours: number;
  description?: string;
  createdAt?: Date;
}

const TimeLogSchema: Schema = new Schema({
  timeLogId: { type: String, required: true, unique: true },
  workspaceId: { type: String, index: true },
  projectId: { type: String, index: true },
  taskId: { type: String, required: true, index: true },
  userId: { type: String, required: true, index: true },
  userName: { type: String },
  date: { type: Date, required: true },
  hours: { type: Number, required: true },
  description: { type: String },
}, { timestamps: true, collection: 'planzoTimeLogs' });

TimeLogSchema.index({ userId: 1, date: -1 });
TimeLogSchema.index({ taskId: 1, date: -1 });

const TimeLog: Model<ITimeLog> = mongoose.models.TimeLog || mongoose.model<ITimeLog>('TimeLog', TimeLogSchema);

export default TimeLog;
