
import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IEmployee extends Document {
  // Identity
  uniqueId: string;
  employeeId?: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  email?: string;
  picture?: string;
  profileImage?: string;
  color?: string;
  initials?: string;
  sort?: number;
  password?: string;

  // Personal Info
  phoneNumber?: string;
  gender?: string;
  dob?: string | Date;
  eligibility?: boolean;
  status: string;
  type?: string;
  eeCode?: string;
  rate?: number;

  // Address
  streetAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;

  // Weekly Schedule / Availability
  sunday?: string;
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  ScheduleNotes?: string;

  // Vehicles & Logistics
  defaultVan1?: string;
  defaultVan2?: string;
  defaultVan3?: string;
  badgeNumber?: string;
  transporterId?: string;
  gasCardPin?: string;
  routesComp?: string;
  dlExpiration?: string | Date;
  motorVehicleReportDate?: string | Date;

  // Document URLs
  offerLetterFile?: string;
  handbookFile?: string;
  driversLicenseFile?: string;
  i9File?: string;
  drugTestFile?: string;
  finalCheck?: string;

  // Offboarding
  terminationDate?: string | Date;
  terminationReason?: string;
  terminationLetter?: string;
  resignationDate?: string | Date;
  resignationType?: string;
  resignationLetter?: string;
  lastDateWorked?: string | Date;
  paycomOffboarded?: boolean;
  amazonOffboarded?: boolean;
  finalCheckIssued?: boolean;
  exitInterviewNotes?: string;
}

const EmployeeSchema: Schema = new Schema({
  uniqueId: { type: String, required: true, unique: true },
  employeeId: { type: String },
  fullName: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  role: { type: String },
  email: { type: String },
  picture: { type: String },
  profileImage: { type: String },
  color: { type: String },
  initials: { type: String },
  sort: { type: Number },
  password: { type: String },

  phoneNumber: { type: String },
  gender: { type: String },
  dob: { type: Schema.Types.Mixed },
  eligibility: { type: Boolean },
  status: { type: String, default: 'Active' },
  type: { type: String },
  eeCode: { type: String },
  rate: { type: Number },

  streetAddress: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },

  sunday: { type: String },
  monday: { type: String },
  tuesday: { type: String },
  wednesday: { type: String },
  thursday: { type: String },
  friday: { type: String },
  saturday: { type: String },
  ScheduleNotes: { type: String },

  defaultVan1: { type: String },
  defaultVan2: { type: String },
  defaultVan3: { type: String },
  badgeNumber: { type: String },
  transporterId: { type: String },
  gasCardPin: { type: String },
  routesComp: { type: String },
  dlExpiration: { type: Schema.Types.Mixed },
  motorVehicleReportDate: { type: Schema.Types.Mixed },

  offerLetterFile: { type: String },
  handbookFile: { type: String },
  driversLicenseFile: { type: String },
  i9File: { type: String },
  drugTestFile: { type: String },
  finalCheck: { type: String },

  terminationDate: { type: Schema.Types.Mixed },
  terminationReason: { type: String },
  terminationLetter: { type: String },
  resignationDate: { type: Schema.Types.Mixed },
  resignationType: { type: String },
  resignationLetter: { type: String },
  lastDateWorked: { type: Schema.Types.Mixed },
  paycomOffboarded: { type: Boolean },
  amazonOffboarded: { type: Boolean },
  finalCheckIssued: { type: Boolean },
  exitInterviewNotes: { type: String },
}, { timestamps: true, collection: 'planzoEmployees', strict: false });

const Employee: Model<IEmployee> = mongoose.models.Employee || mongoose.model<IEmployee>('Employee', EmployeeSchema);

export default Employee;
