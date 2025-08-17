import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const ProfileSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', unique: true, index: true },
  cash: { type: Number, default: 100000 },
  premium: { type: Number, default: 10 },
  level: { type: Number, default: 1 },
  xp: { type: Number, default: 0 }
}, { versionKey:false });

export default models.Profile || model('Profile', ProfileSchema);
