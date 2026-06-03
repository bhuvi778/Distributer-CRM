import mongoose from 'mongoose';

const regionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  states: [String],
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });

const citySchema = new mongoose.Schema({
  name: { type: String, required: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region', required: true },
  state: String,
  pincode: String,
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const areaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  city: { type: mongoose.Schema.Types.ObjectId, ref: 'City', required: true },
  region: { type: mongoose.Schema.Types.ObjectId, ref: 'Region' },
  pincode: String,
  assignedRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export const Region = mongoose.model('Region', regionSchema);
export const City = mongoose.model('City', citySchema);
export const Area = mongoose.model('Area', areaSchema);
