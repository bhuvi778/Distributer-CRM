import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: String,
  category: String,
  brand: String,
  unit: { type: String, default: 'Pcs' },
  hsnCode: String,
  gstRate: { type: Number, default: 18 },
  mrp: { type: Number, default: 0 },
  sellingPrice: { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  stock: { type: Number, default: 0 },
  minStock: { type: Number, default: 10 },
  image: String,
  description: String,
  customFields: {
    size: String,
    color: String,
    batchNo: String,
    expiryDate: Date,
  },
  isActive: { type: Boolean, default: true },
  outletPricing: [{
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    price: Number,
  }],
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
