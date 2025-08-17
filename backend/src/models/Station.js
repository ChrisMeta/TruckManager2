import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const StationSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index:true },
  name: String,
  type: { type:String, enum:['hq','fuel','service'], default:'hq' },
  location: { lat:Number, lng:Number },
  radiusKm: { type:Number, default: 2 }
}, { versionKey:false });

export default models.Station || model('Station', StationSchema);
