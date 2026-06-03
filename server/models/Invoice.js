import mongoose from 'mongoose';

const invoiceLineSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  productName: String,
  hsnCode: String,
  quantity: Number,
  rate: Number,
  discount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  cgst: Number,
  sgst: Number,
  igst: Number,
  amount: Number,
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  type: { type: String, enum: ['sales', 'purchase', 'estimate', 'delivery_challan', 'expense'], default: 'sales' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [invoiceLineSchema],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  cgstTotal: { type: Number, default: 0 },
  sgstTotal: { type: Number, default: 0 },
  igstTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  balanceDue: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'], default: 'draft' },
  invoiceDate: { type: Date, default: Date.now },
  dueDate: Date,
  gstin: String,
  placeOfSupply: String,
  notes: String,
  tallySynced: { type: Boolean, default: false },
  tallySyncDate: Date,
  printFormat: { type: String, enum: ['A4', 'A5', 'thermal'], default: 'A4' },
}, { timestamps: true });

invoiceSchema.pre('save', async function (next) {
  if (!this.invoiceNumber) {
    const prefix = this.type === 'purchase' ? 'PI' : 'INV';
    const count = await mongoose.model('Invoice').countDocuments({ type: this.type });
    this.invoiceNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
  this.balanceDue = this.grandTotal - this.paidAmount;
  next();
});

export default mongoose.model('Invoice', invoiceSchema);
