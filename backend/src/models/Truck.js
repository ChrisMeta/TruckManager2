import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const TruckSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', index:true },
  brand: String,
  model: String,
  category: { type:String, enum:['van','box','rigid','semi'] },
  fuelType: { type:String, enum:['diesel','gasoline','electric'] },
  enginePowerKw: { type:Number, default:150 },
  speedKph: { type:Number, default:80 },
  emptyWeightKg: { type:Number, default: 5000 },
  cargoVolumeM3: { type:Number, default: 20 },
  fuelCapacityL: { type:Number, default:150 },
  batteryKwh: { type:Number, default:0 },
  currentEnergy: { type:Number, default:150 },
  price: { type: Number, default: 0 },
  odometerKm: { type:Number, default:0 },
  wear: { type:Number, default:0, min:0, max:1 },
  lastOilChangeKm: { type:Number, default:0 }, // Track when oil was last changed
  maintenanceStatus: { 
    type: String, 
    enum: ['idle', 'small_maintenance', 'full_restoration'], 
    default: 'idle' 
  },
  maintenanceEndTime: { type: Date, default: null }, // When maintenance will be complete
  status: { type:String, enum:['idle','enroute','maintenance'], default:'idle' },
  assignedAssignmentId: { type: Schema.Types.ObjectId, ref:'Assignment', default:null },
  config: {
    engineId: String,
    engineLabel: String,
    induction: { type:String, default: 'na' },
    wheelbase: { type:String, default: 'standard' },
    body: String,
    gearbox: { type:String, default: 'standard' },
    tire: { type:String, default: 'allseason' }
  },
  createdAt: { type:Date, default: Date.now },
  maintenanceRecords: [{
    type: { type: String, required: true },
    date: { type: Date, required: true },
    cost: { type: Number, required: true },
    odometerKm: { type: Number, required: true }
  }],
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }
}, { versionKey:false });

export default models.Truck || model('Truck', TruckSchema);
