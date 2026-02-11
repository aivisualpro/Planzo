import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICardConfig {
  index: number;
  name: string;
  bgDark?: string;
  bgLight?: string;
}

export interface ICardConfigDoc extends Document {
  page: string; // 'dispatch' | 'hr' | 'manager' | 'reports' | 'owner'
  cards: ICardConfig[];
  updatedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const CardConfigItemSchema = new Schema({
  index: { type: Number, required: true },
  name: { type: String, required: true },
  bgDark: { type: String },
  bgLight: { type: String },
}, { _id: false });

const CardConfigSchema: Schema = new Schema({
  page: { type: String, required: true, unique: true },
  cards: { type: [CardConfigItemSchema], default: [] },
  updatedBy: { type: String },
}, {
  timestamps: true,
  bufferCommands: true,
});

const CardConfig: Model<ICardConfigDoc> = mongoose.models.CardConfig || mongoose.model<ICardConfigDoc>('CardConfig', CardConfigSchema);

export default CardConfig;
