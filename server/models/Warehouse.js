import mongoose from 'mongoose';

const warehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  type: { type: String, enum: ['primary', 'secondary', 'transit', 'retail', 'virtual'], default: 'primary' },
  gstin: String,
  address: {
    street: { type: String, required: true },
    city: String,
    state: { type: String, required: true },
    pincode: String,
  },
  manager: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  phone: String,
  email: String,
  isActive: { type: Boolean, default: true },
  notes: String,
}, { timestamps: true });

export default mongoose.model('Warehouse', warehouseSchema);
