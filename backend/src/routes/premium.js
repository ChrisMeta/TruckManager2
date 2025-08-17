import express from 'express';
import { requireAuth } from '../config/passport.js';
import Profile from '../models/Profile.js';

const GEM_TO_EURO = 1000; // 1★ = €1000

const router = express.Router();

router.post('/convert', requireAuth, async (req,res)=>{
  const { gems, to } = req.body;
  const n = Math.max(0, Math.floor(Number(gems)||0));
  if (!n) return res.status(400).json({ error:'Invalid amount' });
  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) return res.status(400).json({ error:'Profile missing' });
  if (profile.premium < n) return res.status(400).json({ error:`Not enough ★ (have ${profile.premium})` });
  if (to !== 'cash') return res.status(400).json({ error:'Only cash conversion supported for now' });

  profile.premium -= n;
  profile.cash += n * GEM_TO_EURO;
  await profile.save();
  res.json({ ok:true, cash: profile.cash, premium: profile.premium });
});

export default router;
