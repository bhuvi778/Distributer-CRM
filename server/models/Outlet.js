import mongoose from 'mongoose';

const outletSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  type: { type: String, enum: ['retailer', 'distributor', 'wholesaler', 'direct'], default: 'retailer' },
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
  location: { lat: Number, lng: Number },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creditLimit: { type: Number, default: 0 },
  outstandingBalance: { type: Number, default: 0 },
  paymentTerms: { type: String, default: '30 days' },
  category: String,
  isActive: { type: Boolean, default: true },
  customFields: mongoose.Schema.Types.Mixed,
  loginEmail: { type: String, unique: true, sparse: true, lowercase: true },
  loginPassword: { type: String, select: false },
}, { timestamps: true });

export default mongoose.model('Outlet', outletSchema);
