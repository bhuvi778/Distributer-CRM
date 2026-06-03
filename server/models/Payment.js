import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentNumber: { type: String, unique: true },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  mode: { type: String, enum: ['cash', 'upi', 'cheque', 'bank_transfer', 'card'], default: 'cash' },
  referenceNo: String,
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
  paymentDate: { type: Date, default: Date.now },
  notes: String,
  location: { lat: Number, lng: Number },
  isPartial: { type: Boolean, default: false },
}, { timestamps: true });

paymentSchema.pre('save', async function (next) {
  if (!this.paymentNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    this.paymentNumber = `PAY-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Payment', paymentSchema);
