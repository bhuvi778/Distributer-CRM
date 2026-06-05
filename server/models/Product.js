import mongoose from 'mongoose';

const batchSchema = new mongoose.Schema({
  batchNo:    { type: String },
  mfgDate:    Date,
  expiryDate: Date,
  quantity:   { type: Number, default: 0 },
  purchasePrice: Number,
}, { _id: true });

const productSchema = new mongoose.Schema({
  name:          { type: String, required: true },
  sku:           { type: String, sparse: true },       // Item Code
  barcode:       String,
  description:   String,
  category:      String,
  brand:         String,
  unit:          { type: String, default: 'Pcs' },
  secondaryUnit: String,                               // e.g. Case, Dozen
  conversionFactor: { type: Number, default: 1 },      // 1 Case = 12 Pcs

  // Pricing
  mrp:           { type: Number, default: 0 },
  sellingPrice:  { type: Number, default: 0 },
  purchasePrice: { type: Number, default: 0 },
  discount:      { type: Number, default: 0 },         // default discount %
  discountType:  { type: String, enum: ['percent', 'amount'], default: 'percent' },
  offerText:     String,

  // Tax
  hsnCode:   String,
  gstRate:   { type: Number, default: 18 },
  cessRate:  { type: Number, default: 0 },
  taxInclusive: { type: Boolean, default: false },

  // Stock
  stock:         { type: Number, default: 0 },
  minStock:      { type: Number, default: 0 },         // low stock threshold
  weight:        Number,
  weightUnit:    { type: String, default: 'kg' },

  // Images — array of URLs/base64
  images:        [{ type: String }],

  // Batch tracking
  batches:       [batchSchema],
  trackBatch:    { type: Boolean, default: false },

  isActive:      { type: Boolean, default: true },

  outletPricing: [{
    outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
    price:  Number,
  }],
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
