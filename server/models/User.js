import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  phone: String,
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'sales_executive', 'sales_rep', 'retailer', 'manager', 'accountant', 'reception', 'distributor', 'manufacturer', 'employee'],
    default: 'employee',
  },
  jobTitle: String,
  department: String,
  employeeId: String,
  /** Custom sidebar modules — array of paths e.g. /app/orders */
  allowedModules: [{ type: String }],
  /** When true, allowedModules drives sidebar instead of role defaults */
  useCustomAccess: { type: Boolean, default: false },
  /** Action permissions e.g. approve_payments, delete_records, manage_employees */
  permissions: [{ type: String }],
  assignedRoutes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Route' }],
  territory: String,
  region: String,
  avatar: String,
  isActive: { type: Boolean, default: true },
  lastLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date,
  },
  targetAmount: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model('User', userSchema);
