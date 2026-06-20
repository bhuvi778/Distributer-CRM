import mongoose from 'mongoose';

const vanItemSchema = new mongoose.Schema({
  serialNo: String,
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  itemCode: String,
  itemName: String,
  unit: String,
  qty: { type: Number, default: 0 },
  productName: String,
  loadedQty: { type: Number, default: 0 },
  soldQty: { type: Number, default: 0 },
  returnedQty: { type: Number, default: 0 },
  remainingQty: { type: Number, default: 0 },
});

const vanSalesSchema = new mongoose.Schema({
  tripId: { type: String, unique: true, sparse: true },
  warehouse: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vehicleNo: String,
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

vanSalesSchema.pre('validate', async function (next) {
  if (!this.tripId) {
    const count = await mongoose.model('VanSales').countDocuments();
    this.tripId = `VS-${String(count + 1).padStart(5, '0')}`;
  }
  if (!this.vanNumber && this.vehicleNo) this.vanNumber = this.vehicleNo;
  if (!this.vehicleNo && this.vanNumber) this.vehicleNo = this.vanNumber;
  if (!this.salesRep && this.assignedTo) this.salesRep = this.assignedTo;
  if (!this.assignedTo && this.salesRep) this.assignedTo = this.salesRep;
  this.loadIn = (this.loadIn || []).map((item, idx) => {
    const obj = item.toObject ? item.toObject() : item;
    const qty = Number(obj.qty ?? obj.loadedQty ?? 0);
    return {
      ...obj,
      serialNo: obj.serialNo || String(idx + 1),
      itemName: obj.itemName || obj.productName,
      productName: obj.productName || obj.itemName,
      qty,
      loadedQty: Number(obj.loadedQty ?? qty),
    };
  });
  next();
});

export default mongoose.model('VanSales', vanSalesSchema);
