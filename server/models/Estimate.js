import mongoose from 'mongoose';

const estimateSchema = new mongoose.Schema({
  estimateNumber: { type: String, unique: true },
  party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  partyName: String,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    sku: String,
    quantity: Number,
    rate: Number,
    discount: { type: Number, default: 0 },
    gstRate: Number,
    amount: Number,
  }],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'], default: 'draft' },
  validUntil: Date,
  convertedToOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: String,
  terms: String,
}, { timestamps: true });

estimateSchema.pre('save', async function (next) {
  if (!this.estimateNumber) {
    const count = await mongoose.model('Estimate').countDocuments();
    this.estimateNumber = `EST-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Estimate', estimateSchema);
