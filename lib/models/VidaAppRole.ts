
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPermission {
  module: string;
  actions: {
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
    download: boolean;
  };
  fieldScope?: Record<string, boolean>;
}

export interface IVidaAppRole extends Document {
  name: string;
  description?: string;
  permissions: IPermission[];
  createdAt: Date;
  updatedAt: Date;
}

const PermissionSchema = new Schema({
  module: { type: String, required: true },
  actions: {
    view: { type: Boolean, default: true },
    create: { type: Boolean, default: true },
    edit: { type: Boolean, default: true },
    delete: { type: Boolean, default: true },
    approve: { type: Boolean, default: true },
    download: { type: Boolean, default: true },
  },
  fieldScope: { type: Map, of: Boolean }
}, { _id: false });

const VidaAppRoleSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [PermissionSchema],
}, {
  timestamps: true
});

const VidaAppRole: Model<IVidaAppRole> = mongoose.models.VidaAppRole || mongoose.model<IVidaAppRole>('VidaAppRole', VidaAppRoleSchema);

export default VidaAppRole;
