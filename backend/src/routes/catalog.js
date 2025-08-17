import express from 'express';
import { defaultCapabilities } from '../services/derive.js';
const router = express.Router();

// Base specs per model plus allowed capabilities & default config
const catalog = [
  // VAN
  { brand:'Mercedes-Benz', model:'Sprinter', category:'van', fuelType:'diesel', enginePowerKw:140, fuelCapacityL:90, price:42000, speedKph:95,
    defaultConfig: { engineId:'van_r4_2_3_diesel', induction:'turbo', wheelbase:'standard', body:'panel', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_r4_2_0_diesel','van_r4_2_3_diesel','van_v6_3_0_diesel']; return c; })()
  },
  { brand:'Ford', model:'Transit', category:'van', fuelType:'diesel', enginePowerKw:125, fuelCapacityL:80, price:38000, speedKph:90,
    defaultConfig: { engineId:'van_r4_2_0_diesel', induction:'turbo', wheelbase:'extended', body:'highroof', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('van'); c.engineIds=['van_r4_2_0_diesel','van_r4_2_3_diesel']; return c; })()
  },

  // BOX
  { brand:'MAN', model:'TGL', category:'box', fuelType:'diesel', enginePowerKw:180, fuelCapacityL:160, price:86000, speedKph:85,
    defaultConfig: { engineId:'box_i6_7_0_diesel', induction:'turbo', wheelbase:'extended', body:'box30', gearbox:'long', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('box'); c.engineIds=['box_i4_4_5_diesel','box_i6_7_0_diesel']; return c; })()
  },

  // RIGID
  { brand:'DAF', model:'CF', category:'rigid', fuelType:'diesel', enginePowerKw:265, fuelCapacityL:300, price:98000, speedKph:80,
    defaultConfig: { engineId:'rigid_i6_10_5_diesel', induction:'turbo', wheelbase:'standard', body:'rigid50', gearbox:'standard', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('rigid'); c.engineIds=['rigid_i6_10_5_diesel','rigid_v8_13_0_diesel']; return c; })()
  },

  // SEMI
  { brand:'Scania', model:'R 450', category:'semi', fuelType:'diesel', enginePowerKw:331, fuelCapacityL:400, price:125000, speedKph:88,
    defaultConfig: { engineId:'semi_i6_13_0_diesel', induction:'turbo', wheelbase:'standard', body:'tractor', gearbox:'long', tire:'allseason' },
    capabilities: (()=>{ const c=defaultCapabilities('semi'); c.engineIds=['semi_i6_13_0_diesel','semi_v8_16_0_diesel']; return c; })()
  },
  { brand:'Volvo', model:'FH Electric', category:'semi', fuelType:'electric', enginePowerKw:490, batteryKwh:540, price:210000, speedKph:85,
    defaultConfig: { engineId:'semi_ev_490', induction:'na', wheelbase:'standard', body:'tractor', gearbox:'standard', tire:'eco' },
    capabilities: (()=>{ const c=defaultCapabilities('semi'); c.engineIds=['semi_ev_490']; c.induction=['na']; return c; })()
  }
];

router.get('/', (req,res)=> res.json(catalog));

export function findCatalogItem(brand, model){
  return catalog.find(c => c.brand === brand && c.model === model);
}

export default router;
