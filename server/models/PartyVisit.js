import mongoose from 'mongoose';

const partyVisitSchema = new mongoose.Schema({
  party: { type: mongoose.Schema.Types.ObjectId, ref: 'Party' },
  partyType: { type: String, enum: ['customer', 'distributor', 'super_stocker', 'supplier'], default: 'customer' },
  partyName: String,
  region: String,
  city: String,
  area: String,
  comment: String,
  status: { type: String, enum: ['active', 'inactive', 'blocked'], default: 'active' },
  location: {
    lat: Number,
    lng: Number,
  },
  selfie: String,
  partyPhoto: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('PartyVisit', partyVisitSchema);
