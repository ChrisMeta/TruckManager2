/**
 * Derivation logic for truck stats based on selected configuration.
 * We keep it simple but expandable.
 */

export const ENGINE_LIBRARY = {
  // Vans
  'van_r4_2_0_diesel': { kw: 105, weight: 180, label:'R4 2.0 Diesel' },
  'van_r4_2_3_diesel': { kw: 125, weight: 190, label:'R4 2.3 Diesel' },
  'van_v6_3_0_diesel': { kw: 150, weight: 240, label:'V6 3.0 Diesel' },
  'van_ev_single_200': { kw: 200, weight: 350, label:'EV Single Motor 200kW', ev:true },

  // Box
  'box_i4_4_5_diesel': { kw: 160, weight: 400, label:'I4 4.5 Diesel' },
  'box_i6_7_0_diesel': { kw: 220, weight: 520, label:'I6 7.0 Diesel' },
  'box_v8_9_0_diesel': { kw: 280, weight: 640, label:'V8 9.0 Diesel' },
  'box_ev_dual_350': { kw: 350, weight: 900, label:'EV Dual Motor 350kW', ev:true },

  // Rigid
  'rigid_i6_10_5_diesel': { kw: 300, weight: 800, label:'I6 10.5 Diesel' },
  'rigid_v8_13_0_diesel': { kw: 360, weight: 950, label:'V8 13.0 Diesel' },

  // Semi
  'semi_i6_13_0_diesel': { kw: 330, weight: 950, label:'I6 13.0 Diesel' },
  'semi_v8_16_0_diesel': { kw: 400, weight: 1100, label:'V8 16.0 Diesel' },
  'semi_ev_490': { kw: 490, weight: 1500, label:'EV 490kW', ev:true },
};

export const OPTION_SETS = {
  induction: [
    { id:'na', label:'Naturally Aspirated', kwMul:1.00 },
    { id:'turbo', label:'Turbocharged', kwMul:1.20 },
    { id:'supercharger', label:'Supercharged', kwMul:1.15 },
  ],
  wheelbase: [
    { id:'standard', label:'Standard', weight:+0, speedMul:1.00 },
    { id:'extended', label:'Extended', weight:+120, speedMul:0.99 },
    { id:'extra_long', label:'Extra Long', weight:+240, speedMul:0.98 },
  ],
  // For semi tractors, we expose only 'tractor_standard' implicitly via capability
  body: {
    van: [
      { id:'panel', label:'Panel Van', vol:12, weight:+0 },
      { id:'highroof', label:'High Roof', vol:15, weight:+40 },
      { id:'long', label:'Extra Long', vol:18, weight:+80 },
    ],
    box: [
      { id:'box20', label:'Box 20 m³', vol:20, weight:+0 },
      { id:'box30', label:'Box 30 m³', vol:30, weight:+80 },
      { id:'box40', label:'Box 40 m³', vol:40, weight:+140 },
    ],
    rigid: [
      { id:'rigid50', label:'Rigid 50 m³', vol:50, weight:+0 },
      { id:'rigid70', label:'Rigid 70 m³', vol:70, weight:+200 },
    ],
    semi: [
      { id:'tractor', label:'Tractor Unit', vol:0, weight:+0 },
    ]
  },
  gearbox: [
    { id:'standard', label:'Standard', speedMul:1.00 },
    { id:'close', label:'Close Ratio', speedMul:0.98 },
    { id:'long', label:'Long Ratio', speedMul:1.02 },
  ],
  tire: [
    { id:'allseason', label:'All Season', speedMul:1.00 },
    { id:'eco', label:'Eco Low-Roll', speedMul:1.01 },
    { id:'sport', label:'Sport Grip', speedMul:1.02 },
  ]
};

/**
 * Given category and base item, produce default allowed capabilities by category.
 * Individual models can further restrict these in catalog.
 */
export function defaultCapabilities(category){
  const caps = {
    engineIds: Object.keys(ENGINE_LIBRARY).filter(id => id.startsWith(category+'_')),
    induction: OPTION_SETS.induction.map(o=>o.id),
    wheelbase: ['standard','extended','extra_long'],
    body: OPTION_SETS.body[category].map(o=>o.id),
    gearbox: OPTION_SETS.gearbox.map(o=>o.id),
    tire: OPTION_SETS.tire.map(o=>o.id)
  };
  if (category === 'semi'){
    caps.wheelbase = ['standard']; // trailer carries load, tractor WB fixed
    caps.body = ['tractor'];
  }
  return caps;
}

export function deriveStats(category, base, cfg){
  // base contains starting speed, weights, etc.
  const engine = ENGINE_LIBRARY[cfg.engineId] || { kw: base.enginePowerKw||150, weight:0, label:'Engine' };
  const ind = OPTION_SETS.induction.find(i => i.id === cfg.induction) || OPTION_SETS.induction[0];
  const wb = OPTION_SETS.wheelbase.find(w => w.id === cfg.wheelbase) || OPTION_SETS.wheelbase[0];
  const gb = OPTION_SETS.gearbox.find(g => g.id === cfg.gearbox) || OPTION_SETS.gearbox[0];
  const tr = OPTION_SETS.tire.find(t => t.id === cfg.tire) || OPTION_SETS.tire[0];
  const bodyList = OPTION_SETS.body[category] || [{ id:'panel', vol:12, weight:0 }];
  const body = bodyList.find(b => b.id === cfg.body) || bodyList[0];

  // Power
  const powerKw = Math.round(engine.kw * ind.kwMul);

  // Speed scaled gently by power ratio and gear/tire/wb multipliers
  const baseSpeed = base.speedKph || 80;
  const speed = Math.round(baseSpeed * Math.pow(powerKw / Math.max(60, base.enginePowerKw || engine.kw), 0.25) * gb.speedMul * tr.speedMul * wb.speedMul);

  // Weight and cargo
  const emptyBase = base.emptyWeightKg || 5000;
  const emptyWeightKg = Math.round(emptyBase + engine.weight + wb.weight + (body.weight||0));
  const cargoVolumeM3 = body.vol ?? base.cargoVolumeM3 ?? 0;

  return {
    enginePowerKw: powerKw,
    speedKph: speed,
    emptyWeightKg,
    cargoVolumeM3,
    engineLabel: engine.label
  };
}
