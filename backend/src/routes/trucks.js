import express from 'express';
import { requireAuth } from '../config/passport.js';
import Truck from '../models/Truck.js';
import Profile from '../models/Profile.js';
import Assignment from '../models/Assignment.js';
import { deriveStats, defaultCapabilities, ENGINE_LIBRARY, OPTION_SETS } from '../services/derive.js';
import { findCatalogItem } from './catalog.js';

const GEM_TO_EURO = 1000; // 1★ = €1000

const router = express.Router();

router.get('/', requireAuth, async (req,res)=>{
  const trucks = await Truck.find({ userId: req.user._id });
  res.json(trucks);
});

router.get('/:id/options', requireAuth, async (req,res)=>{
  const { id } = req.params;
  const t = await Truck.findOne({ _id:id, userId:req.user._id });
  if (!t) return res.status(404).json({ error:'Not found' });
  const base = findCatalogItem(t.brand, t.model);
  const caps = base?.capabilities || defaultCapabilities(t.category);

  const engine = (caps.engineIds || []).map(id => ({ id, label: ENGINE_LIBRARY[id]?.label || id }));
  const induction = OPTION_SETS.induction.filter(o => (caps.induction || []).includes(o.id));
  const wheelbase = OPTION_SETS.wheelbase.filter(o => (caps.wheelbase || []).includes(o.id));
  const body = (OPTION_SETS.body[t.category] || []).filter(o => (caps.body || []).includes(o.id));
  const gearbox = OPTION_SETS.gearbox.filter(o => (caps.gearbox || []).includes(o.id));
  const tire = OPTION_SETS.tire.filter(o => (caps.tire || []).includes(o.id));

  const current = {
    engineId: t.config?.engineId || base?.defaultConfig?.engineId || (engine[0]?.id),
    induction: t.config?.induction || base?.defaultConfig?.induction || (induction[0]?.id),
    wheelbase: t.config?.wheelbase || base?.defaultConfig?.wheelbase || (wheelbase[0]?.id),
    body: t.config?.body || base?.defaultConfig?.body || (body[0]?.id),
    gearbox: t.config?.gearbox || base?.defaultConfig?.gearbox || (gearbox[0]?.id),
    tire: t.config?.tire || base?.defaultConfig?.tire || (tire[0]?.id),
  };

  res.json({ options: { engine, induction, wheelbase, body, gearbox, tire }, current });
});

router.post('/buy', requireAuth, async (req,res)=>{
  const data = req.body;
  const price = Number(data.price || 0);
  const pay = data.paymentMethod || 'cash'; // 'cash' | 'premium'
  let profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) profile = await Profile.create({ userId: req.user._id, cash: 100000, premium:10, level:1, xp:0 });

  if (pay === 'cash'){
    if (profile.cash < price) return res.status(400).json({ error:`Not enough cash (have €${profile.cash}, need €${price})` });
  } else if (pay === 'premium'){
    const gemsNeeded = Math.ceil(price / GEM_TO_EURO);
    if (profile.premium < gemsNeeded) return res.status(400).json({ error:`Not enough ★ (need ${gemsNeeded}, have ${profile.premium})` });
    profile.premium -= gemsNeeded;
  } else {
    return res.status(400).json({ error:'Unknown payment method' });
  }

  const base = findCatalogItem(data.brand, data.model);
  const def = base?.defaultConfig || {};
  const created = await Truck.create({
    userId: req.user._id,
    brand: data.brand, model: data.model, category: data.category, fuelType: data.fuelType,
    enginePowerKw: data.enginePowerKw || 150, engineLevel: 0,
    bodyType: data.bodyType || 'standard', wheelbaseM: data.wheelbaseM || 4.0,
    fuelCapacityL: data.fuelCapacityL || 150, batteryKwh: data.batteryKwh || 0,
    currentEnergy: data.fuelType === 'electric' ? (data.batteryKwh || 0) : (data.fuelCapacityL || 150),
    speedKph: data.speedKph || 80,
    emptyWeightKg: 5000,
    cargoVolumeM3: 20,
    price: price, // Store the original purchase price
    config: {
      engineId: def.engineId || null,
      induction: def.induction || 'na',
      wheelbase: def.wheelbase || 'standard',
      body: def.body || null,
      gearbox: def.gearbox || 'standard',
      tire: def.tire || 'allseason'
    }
  });

  const stats = deriveStats(created.category, { speedKph: created.speedKph, enginePowerKw: created.enginePowerKw, emptyWeightKg: created.emptyWeightKg, cargoVolumeM3: created.cargoVolumeM3 }, created.config);
  created.enginePowerKw = stats.enginePowerKw;
  created.speedKph = stats.speedKph;
  created.emptyWeightKg = stats.emptyWeightKg;
  created.cargoVolumeM3 = stats.cargoVolumeM3;
  created.config.engineLabel = stats.engineLabel;
  await created.save();

  if (pay === 'cash') { profile.cash -= price; }
  // premium already deducted above
  await profile.save();
  res.json(created);
});

router.post('/:id/config', requireAuth, async (req,res)=>{
  const { id } = req.params;
  const cfg = req.body;
  const truck = await Truck.findOne({ _id:id, userId:req.user._id });
  if (!truck) return res.status(404).json({ error:'Not found' });
  let profile = await Profile.findOne({ userId: req.user._id });
  if (!profile) profile = await Profile.create({ userId: req.user._id, cash: 100000, premium:10, level:1, xp:0 });

  const base = findCatalogItem(truck.brand, truck.model);
  const caps = base?.capabilities || {};
  const ensureAllowed = (val, arr) => Array.isArray(arr) && arr.includes(val);

  if (!ensureAllowed(cfg.engineId, caps.engineIds)) return res.status(400).json({ error:'Engine not allowed for this model' });
  if (!ensureAllowed(cfg.induction, caps.induction)) return res.status(400).json({ error:'Induction not allowed' });
  if (!ensureAllowed(cfg.wheelbase, caps.wheelbase)) return res.status(400).json({ error:'Wheelbase not allowed' });
  if (!ensureAllowed(cfg.body, caps.body)) return res.status(400).json({ error:'Body not allowed' });
  if (!ensureAllowed(cfg.gearbox, caps.gearbox)) return res.status(400).json({ error:'Gearbox not allowed' });
  if (!ensureAllowed(cfg.tire, caps.tire)) return res.status(400).json({ error:'Tire not allowed' });

  // Detailed cost model per selection
  let cost = 0;
  const add = (v) => cost += v;
  if (cfg.engineId !== truck.config.engineId) add(8000);
  if (cfg.induction !== truck.config.induction) add(cfg.induction==='turbo'?2500:cfg.induction==='supercharger'?3000:1500);
  if (cfg.wheelbase !== truck.config.wheelbase) add({standard:1200, extended:1600, extra_long:2000}[cfg.wheelbase] || 1500);
  if (cfg.body !== truck.config.body) add(2500);
  if (cfg.gearbox !== truck.config.gearbox) add(cfg.gearbox==='long'?1600:cfg.gearbox==='close'?1400:1200);
  if (cfg.tire !== truck.config.tire) add(cfg.tire==='sport'?900:cfg.tire==='eco'?700:600);

  if (profile.cash < cost) return res.status(400).json({ error:`Not enough cash for config (cost €${cost}, have €${profile.cash})` });

  const stats = deriveStats(truck.category,
    { speedKph: base?.speedKph || truck.speedKph, enginePowerKw: base?.enginePowerKw || truck.enginePowerKw, emptyWeightKg: truck.emptyWeightKg, cargoVolumeM3: truck.cargoVolumeM3 },
    cfg
  );

  truck.config = { ...truck.config, ...cfg, engineLabel: stats.engineLabel };
  truck.enginePowerKw = stats.enginePowerKw;
  truck.speedKph = stats.speedKph;
  truck.emptyWeightKg = stats.emptyWeightKg;
  truck.cargoVolumeM3 = stats.cargoVolumeM3;

  profile.cash -= cost;
  await Promise.all([truck.save(), profile.save()]);
  res.json({ ok:true, cost, truck });
});

// Add this route to your existing trucks router

router.post('/:truckId/sell', requireAuth, async (req, res) => {
  try {
    const { truckId } = req.params;
    
    // Find the truck and verify ownership
    const truck = await Truck.findOne({ _id: truckId, userId: req.user._id });
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found or not owned by user' });
    }

    // Check if truck is currently assigned to a contract
    const activeAssignment = await Assignment.findOne({ 
      truckId: truck._id, 
      status: 'in_progress' 
    });
    
    if (activeAssignment) {
      return res.status(400).json({ error: 'Cannot sell truck while it has an active assignment' });
    }

    // Calculate sell price (50% of original price)
    const sellPrice = Math.floor((truck.price || 0) * 0.5);

    // Delete the truck and update user's cash
    await Truck.deleteOne({ _id: truckId });
    
    // Update user's profile cash
    await Profile.updateOne(
      { userId: req.user._id },
      { $inc: { cash: sellPrice } }
    );

    res.json({ 
      success: true, 
      sellPrice,
      message: `Sold ${truck.brand} ${truck.model} for €${sellPrice.toLocaleString()}` 
    });

  } catch (err) {
    console.error('[POST /trucks/:truckId/sell]', err);
    res.status(500).json({ error: 'Failed to sell truck', detail: String(err?.message || err) });
  }
});

export default router;