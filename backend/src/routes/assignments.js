import express from 'express';
import { requireAuth } from '../config/passport.js';
import Assignment from '../models/Assignment.js';
import Truck from '../models/Truck.js';
import Contract from '../models/Contract.js';
import Profile from '../models/Profile.js';

const router = express.Router();

function remainingKm(assignment, contract) {
  const totalKm = contract.distanceKm || 0;
  const completedKm = totalKm * (assignment.progress || 0);
  return Math.max(0, totalKm - completedKm);
}

router.post('/:id/instant-complete', requireAuth, async (req,res)=>{
  const { id } = req.params;
  const a = await Assignment.findOne({ _id:id });
  if (!a) return res.status(404).json({ error:'Assignment not found' });
  const truck = await Truck.findOne({ _id:a.truckId, userId: req.user._id });
  if (!truck) return res.status(404).json({ error:'Truck not found' });
  const contract = await Contract.findOne({ _id:a.contractId, userId:req.user._id });
  if (!contract) return res.status(404).json({ error:'Contract not found' });
  if (a.status !== 'in_progress') return res.status(400).json({ error:'Assignment not in progress' });

  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) return res.status(400).json({ error:'Profile missing' });

  const kmLeft = remainingKm(a, contract);
  const gemCost = Math.max(1, Math.ceil(kmLeft / 50)); // 1★ per 50km remaining
  if (profile.premium < gemCost) return res.status(400).json({ error:`Not enough ★ (need ${gemCost}, have ${profile.premium})` });

  // Add remaining distance to odometer
  truck.odometerKm = (truck.odometerKm || 0) + kmLeft;
  
  // Calculate wear based on the new odometer value
  let wearFactor = 0.3 / 100000; // 30% per 100,000km
  if (truck.odometerKm % 40000 === 0) {
    wearFactor *= 10; // x10 wear if oil change is due
  }
  truck.wear = Math.min(1, (truck.odometerKm * wearFactor));
  
  profile.premium -= gemCost;
  a.progress = 1;
  a.status = 'completed';
  truck.status = 'idle';
  truck.assignedAssignmentId = null;
  contract.status = 'completed';
  contract.paid = false; // require explicit collect
  
  await Promise.all([profile.save(), a.save(), truck.save(), contract.save()]);

  res.json({ ok:true, gemCost, payout: contract.payout, kmAdded: kmLeft });
});

export default router;