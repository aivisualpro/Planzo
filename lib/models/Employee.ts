
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  uniqueId: string;
  employeeId?: string;
  fullName: string;
  role?: string;
  email?: string;
  picture?: string;
  color?: string;
  initials?: string;
  sort?: number;
}

const EmployeeSchema: Schema = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  employeeId: { type: String },
  fullName: { type: String, required: true },
  role: { type: String },
  email: { type: String },
  picture: { type: String },
  color: { type: String },
  initials: { type: String },
  sort: { type: Number },
}, { timestamps: true, collection: 'planzoEmployees', strict: false });

const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
