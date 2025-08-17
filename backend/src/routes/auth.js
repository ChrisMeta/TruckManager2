import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.post('/register', async (req,res)=>{
  try{
    const { username, email, password } = req.body || {};
    if (!username || !email || !password) return res.status(400).json({ error:'Missing username, email or password' });
    const dup = await User.findOne({ $or: [{ username }, { email }] });
    if (dup) return res.status(400).json({ error:'Username or email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });
    // Seed profile if not present
    await Profile.updateOne({ userId: user._id }, { $setOnInsert: { userId: user._id, cash: 100000, premium: 10, level: 1, xp: 0 } }, { upsert: true });
    res.json({ ok:true, user: { id: user._id, username: user.username, email: user.email } });
  }catch(e){
    res.status(500).json({ error: e.message || 'Register failed' });
  }
});

router.post('/login', async (req,res)=>{
  try{
    const { usernameOrEmail, username, email, password } = req.body || {};
    const id = (usernameOrEmail || username || email || '').trim();
    if (!id || !password) return res.status(400).json({ error:'Missing credentials' });
    const user = await User.findOne({ $or: [{ username: id }, { email: id }] });
    if (!user) return res.status(401).json({ error:'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash || '');
    if (!ok) return res.status(401).json({ error:'Invalid credentials' });
    const token = jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly:true, sameSite:'lax', secure:false, path:'/', maxAge: 7*24*3600*1000 });
    res.json({ ok:true, user: { id:user._id, username:user.username, email:user.email } });
  }catch(e){
    res.status(500).json({ error: e.message || 'Login failed' });
  }
});

router.post('/logout', (req,res)=>{
  res.clearCookie('token');
  res.json({ ok:true });
});

router.get('/me', (req,res)=>{
  const token = req.cookies?.token;
  if (!token) return res.json({ user:null });
  try{
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return res.json({ userId: payload.sub });
  }catch{
    res.clearCookie('token');
    return res.json({ user:null });
  }
});

export default router;
