import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITaskDependency extends Document {
  dependencyId: string;
  taskId: string;             // the task that depends on another
  dependsOnTaskId: string;    // the task it depends on
  type: string;               // finish_to_start | start_to_start | finish_to_finish | start_to_finish
  status: string;             // blocked | unblocked | resolved
  notes?: string;
  createdBy?: string;
  createdAt?: Date;
}

const TaskDependencySchema: Schema = new Schema({
  dependencyId: { type: String, required: true, unique: true },
  taskId: { type: String, required: true, index: true },
  dependsOnTaskId: { type: String, required: true, index: true },
  type: { 
    type: String, 
    default: 'finish_to_start', 
    enum: ['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'] 
  },
  status: { 
    type: String, 
    default: 'blocked', 
    enum: ['blocked', 'unblocked', 'resolved'] 
  },
  notes: { type: String },
  createdBy: { type: String },
}, { timestamps: true, collection: 'planzoTaskDependencies' });

TaskDependencySchema.index({ taskId: 1, dependsOnTaskId: 1 }, { unique: true });

const TaskDependency: Model<ITaskDependency> = mongoose.models.TaskDependency || mongoose.model<ITaskDependency>('TaskDependency', TaskDependencySchema);

export default TaskDependency;
