import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  checkIn: Date,
  checkOut: Date,
  checkInLocation: { lat: Number, lng: Number, address: String },
  checkOutLocation: { lat: Number, lng: Number, address: String },
  selfie: String,
  odoIn: String,
  odoOut: String,
  odoInImage: String,
  odoOutImage: String,
  odoDistance: String,
  images: [String],
  workingHours: { type: Number, default: 0 },
  overtime: { type: Number, default: 0 },
  undertime: { type: Number, default: 0 },
  status: { type: String, enum: ['present', 'absent', 'half_day', 'late', 'on_leave'], default: 'present' },
  notes: String,
  visitedOutlets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' }],
}, { timestamps: true });

attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);
