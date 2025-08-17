import express from 'express';
import { requireAuth } from '../config/passport.js';
import Contract from '../models/Contract.js';
import Assignment from '../models/Assignment.js';
import Truck from '../models/Truck.js';
import Station from '../models/Station.js';
import Profile from '../models/Profile.js';
import { osrmRoute } from '../services/osrm.js';
import { nearbyPlaces } from '../services/places.js';

const router = express.Router();

function randint(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

router.get('/', requireAuth, async (req,res)=>{
  const list = await Contract.find({ userId:req.user._id, status: { $in: ['open','assigned','in_progress','completed'] } }).sort({ createdAt:-1 });
  res.json(list);
});

router.post('/generate', requireAuth, async (req,res)=>{
  const hq = await Station.findOne({ userId:req.user._id, type:'hq' });
  if (!hq) return res.status(400).json({ error:'HQ not set' });

  const places = await nearbyPlaces(hq.location.lat, hq.location.lng, 100, 30);
  if (places.length < 2) return res.status(400).json({ error:'Not enough nearby places' });

  let origin = pick(places), destination = pick(places);
  while (destination.name === origin.name) destination = pick(places);

  const cargoes = ['Furniture','Electronics','Food','Machinery','Textiles','Steel','Packages','Chemicals'];
  const weight = randint(2, 24);
  const volumeM3 = randint(8, 90);

  const { distanceKm, durationSec } = await osrmRoute({ lat: origin.lat, lng: origin.lng }, { lat: destination.lat, lng: destination.lng });
  const payout = Math.round(distanceKm * (60 + Math.random()*40)) + weight*50;
  const deadline = new Date(Date.now() + randint(12, 72)*3600*1000);

  const c = await Contract.create({
    userId:req.user._id, cargoType:pick(cargoes), weightTons:weight, volumeM3,
    payout, origin:{...origin}, destination:{...destination},
    distanceKm, durationSec, deadline, paid:false
  });
  res.json(c);
});

// preview
router.get('/:contractId/route', requireAuth, async (req,res)=>{
  const { contractId } = req.params;
  const c = await Contract.findOne({ _id: contractId, userId: req.user._id });
  if (!c) return res.status(404).json({ error:'Contract not found' });
  const { route } = await osrmRoute(c.origin, c.destination);
  res.json({ route });
});

// assign
router.post('/:contractId/assign', requireAuth, async (req,res)=>{
  const { contractId } = req.params;
  const { truckId } = req.body;
  const contract = await Contract.findOne({ _id: contractId, userId: req.user._id });
  if (!contract) return res.status(404).json({ error:'Contract not found' });
  if (contract.status !== 'open') return res.status(400).json({ error:'Contract not open' });

  const truck = await Truck.findOne({ _id: truckId, userId: req.user._id });
  if (!truck) return res.status(404).json({ error:'Truck not found' });
  if (truck.status !== 'idle') return res.status(400).json({ error:'Truck not idle' });

  const { route, distanceKm, durationSec } = await osrmRoute(contract.origin, contract.destination);

  const assign = await Assignment.create({ userId:req.user._id, truckId:truck._id, contractId:contract._id, route, progress:0, status:'in_progress' });

  truck.status = 'enroute';
  truck.assignedAssignmentId = assign._id;
  contract.status = 'in_progress';
  contract.assignedTruckId = truck._id;
  contract.distanceKm = distanceKm;
  contract.durationSec = durationSec;
  await truck.save(); await contract.save();

  res.json({ ok:true, assignmentId: assign._id });
});

// collect payout
router.post('/:contractId/collect', requireAuth, async (req,res)=>{
  const { contractId } = req.params;
  const c = await Contract.findOne({ _id: contractId, userId: req.user._id });
  if (!c) return res.status(404).json({ error:'Contract not found' });
  if (c.status !== 'completed') return res.status(400).json({ error:'Contract not completed yet' });
  if (c.paid) return res.status(400).json({ error:'Already collected' });

  const profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) return res.status(400).json({ error:'Profile missing' });

  profile.cash += c.payout;
  c.paid = true;
  await Promise.all([profile.save(), c.save()]);
  res.json({ ok:true, cash: profile.cash });
});

router.get('/assignments', requireAuth, async (req,res)=>{
  const list = await Assignment.find({ userId:req.user._id }).sort({ startedAt:-1 });
  res.json(list);
});

export default router;
