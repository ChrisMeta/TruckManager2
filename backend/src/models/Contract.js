import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const ContractSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index:true },
  cargoType: String,
  weightTons: Number,
  volumeM3: Number,
  payout: Number,
  origin: { name:String, lat:Number, lng:Number },
  destination: { name:String, lat:Number, lng:Number },
  distanceKm: Number,
  durationSec: Number,
  deadline: Date,
  status: { type:String, enum:['open','in_progress','completed','failed'], default:'open' },
  paid: { type:Boolean, default:false },
  assignedTruckId: { type: Schema.Types.ObjectId, ref:'Truck', default:null }
}, { timestamps:true, versionKey:false });

export default models.Contract || model('Contract', ContractSchema);
