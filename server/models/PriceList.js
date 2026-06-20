import mongoose from 'mongoose';

const priceListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, unique: true, sparse: true },
  currency: { type: String, default: 'INR' },
  applicableTo: { type: String, enum: ['all', 'customers', 'distributors', 'super_stockers'], default: 'all' },
  pricingType: { type: String, enum: ['markup', 'markdown', 'fixed'], default: 'fixed' },
  markupPercent: { type: Number, default: 0 },
  markdownPercent: { type: Number, default: 0 },
  fixedAmount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  validFrom: Date,
  validTo: Date,
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    pricingType: { type: String, enum: ['markup', 'markdown', 'fixed'], default: 'fixed' },
    markupPercent: { type: Number, default: 0 },
    markdownPercent: { type: Number, default: 0 },
    sellingPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },
  }],
  notes: String,
}, { timestamps: true });

export default mongoose.model('PriceList', priceListSchema);
