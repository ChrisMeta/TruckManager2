import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function requireAuth(req, res, next){
  try{
    const raw = req.cookies?.token || (req.headers.authorization || '').replace(/^Bearer\s+/i,'');
    if (!raw) return res.status(401).json({ error:'Not authenticated' });
    const payload = jwt.verify(raw, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error:'User not found' });
    req.user = user;
    next();
  }catch(e){
    return res.status(401).json({ error:'Invalid token' });
  }
}
