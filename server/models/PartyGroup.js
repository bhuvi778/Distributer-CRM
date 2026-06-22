import mongoose from 'mongoose';

const partyGroupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('PartyGroup', partyGroupSchema);
