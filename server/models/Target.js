import mongoose from 'mongoose';

const targetSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['revenue', 'orders', 'collections', 'visits', 'units'], default: 'revenue' },
  period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly'], default: 'monthly' },
  startDate: Date,
  endDate: Date,
  companyTarget: { type: Number, default: 0 },
  assignments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    target: Number,
    achieved: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
  }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Target', targetSchema);
