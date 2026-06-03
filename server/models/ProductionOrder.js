import mongoose from 'mongoose';

const bomItemSchema = new mongoose.Schema({
  rawMaterial: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  materialName: String,
  quantity: Number,
  unit: String,
  cost: Number,
});

const productionOrderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  finishedGood: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true },
  bom: [bomItemSchema],
  status: { type: String, enum: ['planned', 'in_progress', 'quality_check', 'completed', 'cancelled'], default: 'planned' },
  startDate: Date,
  endDate: Date,
  actualCost: { type: Number, default: 0 },
  scrapItems: [{ product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, quantity: Number }],
  otherCharges: { type: Number, default: 0 },
  qualityStatus: { type: String, enum: ['pending', 'passed', 'failed'], default: 'pending' },
  notes: String,
}, { timestamps: true });

productionOrderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('ProductionOrder').countDocuments();
    this.orderNumber = `PO-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('ProductionOrder', productionOrderSchema);
