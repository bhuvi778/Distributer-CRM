import mongoose from 'mongoose';

const purchaseReturnSchema = new mongoose.Schema({
  purchaseReturnNumber: { type: String, unique: true },
  supplier: String,
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  purchase: { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    rate: Number,
    gstRate: Number,
    amount: Number,
    reason: String,
  }],
  subtotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'pending', 'approved', 'rejected', 'completed'], default: 'draft' },
  returnDate: { type: Date, default: Date.now },
  notes: String,
}, { timestamps: true });

purchaseReturnSchema.pre('save', async function (next) {
  if (!this.purchaseReturnNumber) {
    const count = await mongoose.model('PurchaseReturn').countDocuments();
    this.purchaseReturnNumber = `PR-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('PurchaseReturn', purchaseReturnSchema);
