import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const AssignmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index:true },
  truckId: { type: Schema.Types.ObjectId, ref:'Truck' },
  contractId: { type: Schema.Types.ObjectId, ref:'Contract' },
  route: [{ lat:Number, lng:Number }],
  progress: { type:Number, default:0 },
  status: { type:String, enum:['in_progress','completed','cancelled'], default:'in_progress' },
  startedAt: { type:Date, default: Date.now },
  lastTickAt: { type:Date, default: null }
}, { versionKey:false });

export default models.Assignment || model('Assignment', AssignmentSchema);
