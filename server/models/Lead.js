import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contactPerson: String,
  phone: { type: String, required: true },
  email: String,
  source: { type: String, enum: ['manual', 'outsourcing', 'referral', 'website', 'social_media', 'other'], default: 'manual' },
  status: { type: String, enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'], default: 'new' },
  type: { type: String, enum: ['customer', 'distributor', 'super_stocker', 'retailer'], default: 'customer' },
  address: {
    city: String,
    state: String,
    pincode: String,
  },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expectedValue: { type: Number, default: 0 },
  followUpDate: Date,
  notes: String,
  convertedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  isConverted: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Lead', leadSchema);
