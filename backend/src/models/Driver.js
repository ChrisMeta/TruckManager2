import mongoose from 'mongoose';

const DriverSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  name: String,
  experience: { type: Number, default: 1 },
  assignedTruckId: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', default: null },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export default mongoose.model('Driver', DriverSchema);
