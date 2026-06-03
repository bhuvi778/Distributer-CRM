import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouse: { type: String, default: 'Main' },
  quantity: { type: Number, default: 0 },
  reservedQty: { type: Number, default: 0 },
  availableQty: { type: Number, default: 0 },
  batchNo: String,
  expiryDate: Date,
  customFields: mongoose.Schema.Types.Mixed,
  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true });

inventorySchema.pre('save', function (next) {
  this.availableQty = this.quantity - this.reservedQty;
  next();
});

export default mongoose.model('Inventory', inventorySchema);
