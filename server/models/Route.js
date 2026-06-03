import mongoose from 'mongoose';

const routeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: String,
  description: String,
  area: String,
  city: String,
  state: String,
  assignedReps: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  outlets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' }],
  schedule: {
    monday: { type: Boolean, default: true },
    tuesday: { type: Boolean, default: true },
    wednesday: { type: Boolean, default: true },
    thursday: { type: Boolean, default: true },
    friday: { type: Boolean, default: true },
    saturday: { type: Boolean, default: false },
    sunday: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true },
  estimatedDistance: Number,
}, { timestamps: true });

export default mongoose.model('Route', routeSchema);
