import mongoose from 'mongoose';

const transferOrderSchema = new mongoose.Schema({
  transferNumber: { type: String, unique: true },
  fromWarehouse: { type: String, required: true },
  toWarehouse: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: { type: Number, required: true },
    unit: String,
  }],
  status: { type: String, enum: ['draft', 'in_transit', 'completed', 'cancelled'], default: 'draft' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  transferDate: { type: Date, default: Date.now },
  receivedDate: Date,
  notes: String,
}, { timestamps: true });

transferOrderSchema.pre('save', async function (next) {
  if (!this.transferNumber) {
    const count = await mongoose.model('TransferOrder').countDocuments();
    this.transferNumber = `TRF-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('TransferOrder', transferOrderSchema);
