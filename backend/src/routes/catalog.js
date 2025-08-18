import express from 'express';
import { requireAuth } from '../config/passport.js';
import { defaultCapabilities } from '../services/derive.js';

const router = express.Router();

const catalog = [
  // BUDGET BRANDS

  // ROADMASTER - Budget Brand #1 (Basic, reliable, affordable)
  { brand:'Roadmaster', model:'Cargo Pro 2500', category:'van', fuelType:'diesel', enginePowerKw:110, fuelCapacityL:75, price:28000, speedKph:85,
    defaultConfig: { engineId:'van_r4_2_0_diesel', induction:'na', wheelbase:'standard', body:'panel', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_r4_2_0_diesel']; c.induction=['na','turbo']; return c; })()
  },
  { brand:'Roadmaster', model:'Metro Hauler 4500', category:'box', fuelType:'diesel', enginePowerKw:150, fuelCapacityL:140, price:65000, speedKph:80,
    defaultConfig: { engineId:'box_i4_4_5_diesel', induction:'turbo', wheelbase:'standard', body:'box30', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('box'); c.engineIds=['box_i4_4_5_diesel']; return c; })()
  },
  { brand:'Roadmaster', model:'Heavy Duty 7500', category:'rigid', fuelType:'diesel', enginePowerKw:220, fuelCapacityL:280, price:78000, speedKph:75,
    defaultConfig: { engineId:'rigid_i6_10_5_diesel', induction:'turbo', wheelbase:'standard', body:'rigid50', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('rigid'); c.engineIds=['rigid_i6_10_5_diesel']; return c; })()
  },

  // TITAN MOTORS - Budget Brand #2 (Slightly better than Roadmaster, focus on durability)
  { brand:'Titan Motors', model:'Workhorse Van', category:'van', fuelType:'diesel', enginePowerKw:130, fuelCapacityL:85, price:35000, speedKph:90,
    defaultConfig: { engineId:'van_r4_2_3_diesel', induction:'turbo', wheelbase:'extended', body:'highroof', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_r4_2_0_diesel','van_r4_2_3_diesel']; return c; })()
  },
  { brand:'Titan Motors', model:'Endurance 5000', category:'box', fuelType:'diesel', enginePowerKw:170, fuelCapacityL:150, price:72000, speedKph:82,
    defaultConfig: { engineId:'box_i6_7_0_diesel', induction:'turbo', wheelbase:'extended', body:'box30', gearbox:'standard', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('box'); c.engineIds=['box_i4_4_5_diesel','box_i6_7_0_diesel']; return c; })()
  },
  { brand:'Titan Motors', model:'Highway King', category:'semi', fuelType:'diesel', enginePowerKw:300, fuelCapacityL:350, price:95000, speedKph:85,
    defaultConfig: { engineId:'semi_i6_13_0_diesel', induction:'turbo', wheelbase:'standard', body:'tractor', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('semi'); c.engineIds=['semi_i6_13_0_diesel']; return c; })()
  },

  // NORMAL BRANDS

  // VELOCITY TRUCKS - Normal Brand #1 (Performance focused, sporty designs)
  { brand:'Velocity Trucks', model:'Express Runner', category:'van', fuelType:'diesel', enginePowerKw:160, fuelCapacityL:90, price:48000, speedKph:100,
    defaultConfig: { engineId:'van_v6_3_0_diesel', induction:'turbo', wheelbase:'standard', body:'panel', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_r4_2_3_diesel','van_v6_3_0_diesel']; return c; })()
  },
  { brand:'Velocity Trucks', model:'Rapid Transit', category:'box', fuelType:'diesel', enginePowerKw:200, fuelCapacityL:170, price:92000, speedKph:88,
    defaultConfig: { engineId:'box_i6_7_0_diesel', induction:'supercharger', wheelbase:'extended', body:'box30', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('box'); c.engineIds=['box_i4_4_5_diesel','box_i6_7_0_diesel']; c.induction=['turbo','supercharger']; return c; })()
  },
  { brand:'Velocity Trucks', model:'Road Thunder', category:'semi', fuelType:'diesel', enginePowerKw:380, fuelCapacityL:420, price:145000, speedKph:92,
    defaultConfig: { engineId:'semi_v8_16_0_diesel', induction:'turbo', wheelbase:'standard', body:'tractor', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('semi'); c.engineIds=['semi_i6_13_0_diesel','semi_v8_16_0_diesel']; c.gearbox=['standard','close','long']; return c; })()
  },

  // HORIZON COMMERCIAL - Normal Brand #2 (Technology focused, efficient designs)
  { brand:'Horizon Commercial', model:'EcoFleet 2000', category:'van', fuelType:'diesel', enginePowerKw:145, fuelCapacityL:80, price:45000, speedKph:95,
    defaultConfig: { engineId:'van_r4_2_3_diesel', induction:'turbo', wheelbase:'extended', body:'highroof', gearbox:'standard', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_r4_2_0_diesel','van_r4_2_3_diesel','van_v6_3_0_diesel']; return c; })()
  },
  { brand:'Horizon Commercial', model:'Green Cargo E-Series', category:'box', fuelType:'electric', enginePowerKw:250, batteryKwh:200, price:115000, speedKph:85,
    defaultConfig: { engineId:'box_ev_250', induction:'na', wheelbase:'extended', body:'box30', gearbox:'standard', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('box'); c.engineIds=['box_ev_250']; c.induction=['na']; return c; })()
  },
  { brand:'Horizon Commercial', model:'Efficiency Pro 8000', category:'rigid', fuelType:'diesel', enginePowerKw:280, fuelCapacityL:320, price:105000, speedKph:82,
    defaultConfig: { engineId:'rigid_v8_13_0_diesel', induction:'turbo', wheelbase:'extended', body:'rigid50', gearbox:'long', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('rigid'); c.engineIds=['rigid_i6_10_5_diesel','rigid_v8_13_0_diesel']; return c; })()
  },
  { brand:'Horizon Commercial', model:'NextGen Electric', category:'semi', fuelType:'electric', enginePowerKw:450, batteryKwh:480, price:185000, speedKph:87,
    defaultConfig: { engineId:'semi_ev_450', induction:'na', wheelbase:'standard', body:'tractor', gearbox:'standard', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('semi'); c.engineIds=['semi_ev_450']; c.induction=['na']; return c; })()
  },

  // PREMIUM BRAND

  // STERLING AUTOMOTIVE - Premium Brand (Luxury, high-performance, expensive)
  { brand:'Sterling Automotive', model:'Executive Van', category:'van', fuelType:'diesel', enginePowerKw:200, fuelCapacityL:100, price:75000, speedKph:110,
    defaultConfig: { engineId:'van_v6_3_0_diesel', induction:'supercharger', wheelbase:'extra_long', body:'luxury', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_v6_3_0_diesel']; c.induction=['turbo','supercharger']; c.wheelbase=['standard','extended','extra_long']; return c; })()
  },
  { brand:'Sterling Automotive', model:'Platinum Cargo', category:'box', fuelType:'diesel', enginePowerKw:320, fuelCapacityL:200, price:165000, speedKph:95,
    defaultConfig: { engineId:'box_v8_8_0_diesel', induction:'supercharger', wheelbase:'extra_long', body:'box40', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('box'); c.engineIds=['box_i6_7_0_diesel','box_v8_8_0_diesel']; c.induction=['turbo','supercharger']; c.wheelbase=['standard','extended','extra_long']; return c; })()
  },
  { brand:'Sterling Automotive', model:'Sovereign Heavy', category:'rigid', fuelType:'diesel', enginePowerKw:400, fuelCapacityL:380, price:185000, speedKph:88,
    defaultConfig: { engineId:'rigid_v8_15_0_diesel', induction:'supercharger', wheelbase:'extra_long', body:'rigid60', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('rigid'); c.engineIds=['rigid_v8_13_0_diesel','rigid_v8_15_0_diesel']; c.induction=['turbo','supercharger']; c.wheelbase=['standard','extended','extra_long']; return c; })()
  },
  { brand:'Sterling Automotive', model:'Pinnacle Tractor', category:'semi', fuelType:'diesel', enginePowerKw:520, fuelCapacityL:500, price:285000, speedKph:98,
    defaultConfig: { engineId:'semi_v12_18_0_diesel', induction:'supercharger', wheelbase:'extra_long', body:'luxury_tractor', gearbox:'close', tire:'sport' },
    capabilities: (()=>{ const c=defaultCapabilities('semi'); c.engineIds=['semi_v8_16_0_diesel','semi_v12_18_0_diesel']; c.induction=['turbo','supercharger']; c.wheelbase=['standard','extended','extra_long']; return c; })()
  },
];

export function findCatalogItem(brand, model) {
  return catalog.find(item => item.brand === brand && item.model === model);
}

router.get('/', (req, res) => {
  res.json(catalog);
});

export default router;