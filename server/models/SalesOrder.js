import mongoose from 'mongoose';

const lineItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  sku: String,
  quantity: { type: Number, required: true },
  unit: String,
  rate: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 18 },
  amount: Number,
  hsnCode: String,
});

const salesOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet', required: true },
  salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  items: [lineItemSchema],
  subtotal: { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'delivered', 'cancelled', 'returned'],
    default: 'draft',
  },
  orderType: { type: String, enum: ['regular', 'van', 'return'], default: 'regular' },
  notes: String,
  orderDate: { type: Date, default: Date.now },
  deliveryDate: Date,
  location: { lat: Number, lng: Number },
}, { timestamps: true });

salesOrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('SalesOrder').countDocuments();
    this.orderNumber = `SO-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('SalesOrder', salesOrderSchema);
