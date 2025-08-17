import mongoose from 'mongoose';
const Schema = mongoose.Schema;
const { models, model } = mongoose;

const UserSchema = new Schema({
  username: { type:String, unique:true, index:true },
  email: { type:String, unique:true, index:true },
  passwordHash: String,
}, { versionKey:false });

export default models.User || model('User', UserSchema);
