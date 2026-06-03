import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema({
  purchaseNumber: { type: String, unique: true },
  supplier: String,
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    rate: Number,
    gstRate: Number,
    amount: Number,
  }],
  subtotal: Number,
  taxTotal: Number,
  grandTotal: Number,
  status: { type: String, enum: ['draft', 'ordered', 'received', 'cancelled'], default: 'draft' },
  purchaseDate: { type: Date, default: Date.now },
  receivedDate: Date,
  notes: String,
}, { timestamps: true });

purchaseSchema.pre('save', async function (next) {
  if (!this.purchaseNumber) {
    const count = await mongoose.model('Purchase').countDocuments();
    this.purchaseNumber = `PUR-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('Purchase', purchaseSchema);
