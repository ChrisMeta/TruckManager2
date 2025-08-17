import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const TruckSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index:true },
  brand: String,
  model: String,
  category: { type:String, enum:['van','box','rigid','semi'] },
  fuelType: { type:String, enum:['diesel','gasoline','electric'], default:'diesel' },
  enginePowerKw: { type:Number, default:150 },
  engineLevel: { type:Number, default:0 },
  bodyType: { type:String, default:'standard' },
  wheelbaseM: { type:Number, default:4.0 },
  fuelCapacityL: { type:Number, default:150 },
  batteryKwh: { type:Number, default:0 },
  currentEnergy: { type:Number, default:150 },
  wear: { type:Number, default:0 },
  maintenanceDueKm: { type:Number, default:20000 },
  odometerKm: { type:Number, default:0 },
  status: { type:String, enum:['idle','enroute','refueling','maintenance'], default:'idle' },
  speedKph: { type:Number, default:80 },
  emptyWeightKg: { type:Number, default: 5000 },
  cargoVolumeM3: { type:Number, default: 20 },
  location: { lat: { type:Number, default:52.52 }, lng: { type:Number, default:13.405 } },
  assignedAssignmentId: { type: Schema.Types.ObjectId, ref:'Assignment', default:null },
  refuelUntil: { type: Date, default: null },
  config: {
    engineId: { type:String, default: null },
    induction: { type:String, default: 'na' },
    wheelbase: { type:String, default: 'standard' },
    body: { type:String, default: null },
    gearbox: { type:String, default: 'standard' },
    tire: { type:String, default: 'allseason' },
    engineLabel: { type:String, default: '' }
  },
  createdAt: { type:Date, default: Date.now },
  price: { type: Number, default: 0 }, // Original purchase price
}, { versionKey:false });

export default models.Truck || model('Truck', TruckSchema);
