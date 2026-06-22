import mongoose from 'mongoose';

const creditNoteSchema = new mongoose.Schema({
  creditNoteNumber: { type: String, unique: true },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  outlet: { type: mongoose.Schema.Types.ObjectId, ref: 'Outlet' },
  party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  partyName: String,
  amount: { type: Number, default: 0 },
  reason: String,
  status: { type: String, enum: ['draft', 'issued', 'settled', 'cancelled'], default: 'draft' },
  notes: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

creditNoteSchema.pre('save', async function (next) {
  if (!this.creditNoteNumber) {
    const count = await mongoose.model('CreditNote').countDocuments();
    this.creditNoteNumber = `CN-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

export default mongoose.model('CreditNote', creditNoteSchema);
