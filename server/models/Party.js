import mongoose from 'mongoose';

const partySchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  type: { type: String, enum: ['customer', 'distributor', 'super_stocker', 'supplier', 'visited'], required: true },
  group: String,
  contactPerson: String,
  phone: String,
  email: String,
  gstin: String,
  pan: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  paymentTerms: { type: String, default: '30 days' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  priceList: { type: mongoose.Schema.Types.ObjectId, ref: 'PriceList' },
  isActive: { type: Boolean, default: true },
  notes: String,
  loginEmail: { type: String, unique: true, sparse: true, lowercase: true },
  loginPassword: { type: String, select: false },
}, { timestamps: true });

export default mongoose.model('Party', partySchema);
