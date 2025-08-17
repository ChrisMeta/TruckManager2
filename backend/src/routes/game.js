import express from 'express';
import { requireAuth } from '../config/passport.js';
import Truck from '../models/Truck.js';
import Assignment from '../models/Assignment.js';
import Contract from '../models/Contract.js';
import Station from '../models/Station.js';
import Profile from '../models/Profile.js';

const router = express.Router();

router.get('/state', requireAuth, async (req,res)=>{
  try{
    const defaults = { cash: 100000, premium: 10, level: 1, xp: 0 };
    // Use UPSERT to avoid duplicate-key races when React calls twice in dev
    await Profile.updateOne(
      { userId: req.user._id },
      { $setOnInsert: { userId: req.user._id, ...defaults } },
      { upsert: true }
    );

    // Fetch and backfill missing fields if the doc existed before
    const profile = await Profile.findOne({ userId: req.user._id });
    const patch = {};
    if (profile.premium == null) patch.premium = defaults.premium;
    if (profile.level == null) patch.level = defaults.level;
    if (profile.xp == null) patch.xp = defaults.xp;
    if (Object.keys(patch).length) {
      await Profile.updateOne({ _id: profile._id }, { $set: patch });
      Object.assign(profile, patch);
    }

    const [trucks, assignments, contracts, stations] = await Promise.all([
      Truck.find({ userId:req.user._id }),
      Assignment.find({ userId:req.user._id }),
      Contract.find({ userId:req.user._id }),
      Station.find({ userId:req.user._id })
    ]);
    res.json({ profile, trucks, assignments, contracts, stations });
  }catch(err){
    console.error('[GET /api/game/state] ', err);
    res.status(500).json({ error: 'Game state error', detail: String(err?.message || err) });
  }
});

export default router;
