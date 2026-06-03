import mongoose from 'mongoose';

const locationTrackSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: Number,
  accuracy: Number,
  address: String,
  route: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  distanceTravelled: { type: Number, default: 0 },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

locationTrackSchema.index({ user: 1, timestamp: -1 });

export default mongoose.model('LocationTrack', locationTrackSchema);
