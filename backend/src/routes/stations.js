import express from 'express';
import { requireAuth } from '../config/passport.js';
import Station from '../models/Station.js';

const router = express.Router();

router.get('/', requireAuth, async (req,res)=>{
  // Return only HQ (if any)
  const list = await Station.find({ userId:req.user._id, type:'hq' });
  res.json(list);
});

router.post('/hq', requireAuth, async (req,res)=>{
  const { lat, lng, name } = req.body;
  await Station.deleteMany({ userId:req.user._id, type:'hq' });
  const doc = await Station.create({ userId:req.user._id, type:'hq', name: name || 'HQ', location:{ lat, lng }, radiusKm: 2 });
  res.json(doc);
});

// Disable generic station creation
router.post('/', requireAuth, async (req,res)=>{
  res.status(404).json({ error: 'Stations are disabled in this build' });
});

export default router;
