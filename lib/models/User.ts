import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  AppRole: string;
  designation?: string;
  bioDescription?: string;
  isOnWebsite?: boolean;
  profilePicture?: string;
  isActive: boolean;
  serialNo?: string;
  signature?: string;
  location?: string;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String },
  phone: { type: String },
  address: { type: String },
  serialNo: { type: String, index: true },
  signature: { type: String },
  AppRole: { 
    type: String, 
    required: true,
    default: 'Manager',
    index: true
  },
  designation: { type: String },
  bioDescription: { type: String },
  isOnWebsite: { type: Boolean, default: false },
  profilePicture: { type: String },
  isActive: { type: Boolean, default: true, index: true },
  location: { type: String },
}, { collection: 'SYMXUsers' });

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
