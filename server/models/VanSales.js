import mongoose from 'mongoose';

const vanItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: String,
  loadedQty: { type: Number, default: 0 },
  soldQty: { type: Number, default: 0 },
  returnedQty: { type: Number, default: 0 },
  remainingQty: { type: Number, default: 0 },
});

const vanSalesSchema = new mongoose.Schema({
  vanNumber: { type: String, required: true },
  salesRep: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  date: { type: Date, default: Date.now },
  loadIn: [vanItemSchema],
  loadOut: [vanItemSchema],
  status: { type: String, enum: ['loading', 'on_route', 'completed', 'settled'], default: 'loading' },
  totalSales: { type: Number, default: 0 },
  totalCollection: { type: Number, default: 0 },
  eodSummary: mongoose.Schema.Types.Mixed,
}, { timestamps: true });

export default mongoose.model('VanSales', vanSalesSchema);
