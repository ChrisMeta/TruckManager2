import express from 'express';
import { requireAuth } from '../config/passport.js';
import Truck from '../models/Truck.js';
import Profile from '../models/Profile.js';
import Assignment from '../models/Assignment.js';
import Station from '../models/Station.js'; // Added import for Station model
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

router.post('/buy', requireAuth, async (req, res) => {
  try {
    const { brand, model, category, fuelType, enginePowerKw, speedKph, emptyWeightKg, cargoVolumeM3, fuelCapacityL, batteryKwh, price, paymentMethod } = req.body;
    
    // Get user's HQ location for default truck placement
    const hqStation = await Station.findOne({ userId: req.user._id, type: 'hq' });
    const defaultLocation = hqStation && hqStation.location ? 
      { lat: hqStation.location.lat, lng: hqStation.location.lng } : // Fixed: access nested location object
      { lat: 52.5200, lng: 13.4050 }; // Default to Berlin if no HQ found
    
    const truck = new Truck({
      userId: req.user._id,
      brand,
      model,
      category,
      fuelType,
      enginePowerKw,
      speedKph,
      emptyWeightKg,
      cargoVolumeM3,
      fuelCapacityL,
      batteryKwh,
      price,
      location: defaultLocation,
      currentEnergy: fuelType === 'electric' ? batteryKwh : fuelCapacityL,
      status: 'idle',
      wear: 0,
      odometerKm: 0,
      lastOilChangeKm: 0
    });

    await truck.save();
    res.json({ message: 'Truck purchased successfully', truck });
  } catch (error) {
    console.error('[POST /trucks/buy] Error:', error);
    res.status(400).json({ error: error.message });
  }
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

    // Calculate sell price with depreciation
    const defaultPrices = {
      'van': 25000,
      'box': 45000,
      'rigid': 65000,
      'semi': 85000
    };
    
    const originalPrice = truck.price || defaultPrices[truck.category] || 50000;
    const baseValue = Math.floor(originalPrice * 0.5); // 50% base resale value
    
    // Calculate depreciation: 30% per 100,000km
    const odometerKm = truck.odometerKm || 0;
    const depreciationFactor = Math.max(0.1, 1 - (odometerKm / 100000) * 0.3); // Minimum 10% of base value
    const sellPrice = Math.floor(baseValue * depreciationFactor);

    console.log(`[SELL] ${truck.brand} ${truck.model}`);
    console.log(`[SELL] Original: €${originalPrice}, Base: €${baseValue}, Odometer: ${odometerKm}km`);
    console.log(`[SELL] Depreciation factor: ${depreciationFactor.toFixed(2)}, Final: €${sellPrice}`);

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
      originalPrice,
      odometerKm,
      depreciationFactor,
      message: `Sold ${truck.brand} ${truck.model} for €${sellPrice.toLocaleString()} (${odometerKm.toLocaleString()}km driven)` 
    });

  } catch (err) {
    console.error('[POST /trucks/:truckId/sell]', err);
    res.status(500).json({ error: 'Failed to sell truck', detail: String(err?.message || err) });
  }
});

router.get('/:id/maintenance', requireAuth, async (req, res) => {
  try {
    const truck = await Truck.findOne({ _id: req.params.id, userId: req.user._id });
    if (!truck) return res.status(404).json({ error: 'Truck not found' });

    const odometerKm = truck.odometerKm || 0;
    const lastOilChangeKm = truck.lastOilChangeKm || 0;
    const kmSinceOilChange = odometerKm - lastOilChangeKm;
    
    res.json({
      odometerKm,
      lastOilChangeKm,
      kmSinceOilChange,
      oilChangeOverdue: kmSinceOilChange >= 40000,
      wear: truck.wear || 0,
      records: truck.maintenanceRecords || [],
      costs: {
        basicMaintenance: 500,
        oilChange: 200,
        majorService: 1500
      }
    });
  } catch (err) {
    console.error('[GET /trucks/:id/maintenance]', err);
    res.status(500).json({ error: 'Failed to get maintenance data' });
  }
});

router.post('/:id/maintenance', requireAuth, async (req, res) => {
  try {
    const { type } = req.body;
    const truck = await Truck.findOne({ _id: req.params.id, userId: req.user._id });
    if (!truck) return res.status(404).json({ error: 'Truck not found' });

    const profile = await Profile.findOne({ userId: req.user._id });
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    let cost = 0;
    let message = '';
    const now = new Date();

    switch (type) {
      case 'oil_change':
        cost = 200;
        if (profile.cash < cost) return res.status(400).json({ error: 'Insufficient funds' });
        truck.lastOilChangeKm = truck.odometerKm || 0;
        message = 'Oil change completed';
        break;
        
      case 'basic':
        cost = 500;
        if (profile.cash < cost) return res.status(400).json({ error: 'Insufficient funds' });
        truck.wear = Math.max(0, (truck.wear || 0) - 0.1); // Reduce wear by 10%
        message = 'Basic maintenance completed';
        break;
        
      case 'major':
        cost = 1500;
        if (profile.cash < cost) return res.status(400).json({ error: 'Insufficient funds' });
        truck.wear = Math.max(0, (truck.wear || 0) - 0.3); // Reduce wear by 30%
        truck.lastOilChangeKm = truck.odometerKm || 0;
        message = 'Major service completed';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid maintenance type' });
    }

    // Add maintenance record
    if (!truck.maintenanceRecords) truck.maintenanceRecords = [];
    truck.maintenanceRecords.push({
      type,
      date: now,
      cost,
      odometerKm: truck.odometerKm || 0
    });

    // Deduct cost
    profile.cash -= cost;

    await truck.save();
    await profile.save();

    res.json({ message: `${message}. Cost: €${cost}`, cost });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;