import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubTask extends Document {
  subtaskId: string;
  taskId: string;
  subTask: string;
  status?: string;
  createdBy?: string;
  createdDate?: Date;
  completedBy?: string;
  completionDate?: Date;
}

const SubTaskSchema: Schema = new Schema({
  subtaskId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true, index: true },
  subTask: { type: String, required: true },
  status: { type: String, default: 'Not Started' },
  createdBy: { type: String },
  createdDate: { type: Date },
  completedBy: { type: String },
  completionDate: { type: Date },
}, { timestamps: true, collection: 'planzoSubTasks' });

const SubTask: Model<ISubTask> = mongoose.models.SubTask || mongoose.model<ISubTask>('SubTask', SubTaskSchema);

export default SubTask;
