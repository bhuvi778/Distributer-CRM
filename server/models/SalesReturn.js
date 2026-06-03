import mongoose from 'mongoose';

const salesReturnSchema = new mongoose.Schema({
  returnNumber: { type: String, unique: true },
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    rate: Number,
    reason: String,
    amount: Number,
  }],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'completed'], default: 'pending' },
  returnDate: { type: Date, default: Date.now },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  creditNote: String,
  notes: String,
}, { timestamps: true });

salesReturnSchema.pre('save', async function (next) {
  if (!this.returnNumber) {
    const count = await mongoose.model('SalesReturn').countDocuments();
    this.returnNumber = `SR-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('SalesReturn', salesReturnSchema);
