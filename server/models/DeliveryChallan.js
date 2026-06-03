import mongoose from 'mongoose';

const deliveryChallanSchema = new mongoose.Schema({
  challanNumber: { type: String, unique: true },
  salesOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'SalesOrder' },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  deliveryAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: String,
    quantity: Number,
    unit: String,
  }],
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    pincode: String,
  },
  status: { type: String, enum: ['pending', 'dispatched', 'delivered', 'returned'], default: 'pending' },
  dispatchDate: Date,
  deliveredDate: Date,
  vehicleNumber: String,
  notes: String,
}, { timestamps: true });

deliveryChallanSchema.pre('save', async function (next) {
  if (!this.challanNumber) {
    const count = await mongoose.model('DeliveryChallan').countDocuments();
    this.challanNumber = `DC-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('DeliveryChallan', deliveryChallanSchema);
