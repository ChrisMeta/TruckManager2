import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';

const SUBTABS = ['performance', 'chassis', 'cargo', 'tyresGearbox', 'maintenance'];

function Select({ label, value, onChange, options }){
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <select className="input" value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
      </select>
    </div>
  );
}

export default function Garage({ state, onChanged }){
  const { t } = useLanguage();
  const [open, setOpen] = useState(null); // truckId editing
  const [tab, setTab] = useState('performance');
  const [opts, setOpts] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selling, setSelling] = useState(null); // truckId being sold
  const [error, setError] = useState('');
  const [lastCost, setLastCost] = useState(null);
  const [sellMessage, setSellMessage] = useState('');
  const [maintenanceData, setMaintenanceData] = useState(null);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);

  async function loadOptions(truckId){
    setError(''); setOpts(null); setLastCost(null);
    try{
      const { data } = await api.get(`/trucks/${truckId}/options`);
      setOpts(data);
      setForm(data.current);
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }
  }

  async function loadMaintenanceData(truckId){
    setMaintenanceLoading(true);
    try{
      const { data } = await api.get(`/trucks/${truckId}/maintenance`);
      setMaintenanceData(data);
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }finally{
      setMaintenanceLoading(false);
    }
  }

  function startEdit(truck){
    setOpen(truck._id);
    setTab('performance');
    setMaintenanceData(null); // Reset maintenance data when opening new truck
    loadOptions(truck._id);
  }
  
  function update(k, v){ setForm(prev => ({ ...prev, [k]: v })); }

  function estimateCost(prev){
    if (!opts) return 0;
    const cur = form, old = opts.current;
    let cost = 0;
    if (cur.engineId !== old.engineId) cost += 8000;
    if (cur.induction !== old.induction) cost += (cur.induction==='turbo'?2500:cur.induction==='supercharger'?3000:1500);
    if (cur.wheelbase !== old.wheelbase) cost += ({standard:1200, extended:1600, extra_long:2000}[cur.wheelbase] || 1500);
    if (cur.body !== old.body) cost += 2500;
    if (cur.gearbox !== old.gearbox) cost += (cur.gearbox==='long'?1600:cur.gearbox==='close'?1400:1200);
    if (cur.tire !== old.tire) cost += (cur.tire==='sport'?900:cur.tire==='eco'?700:600);
    return cost;
  }

  async function save(truckId){
    setSaving(true); setError(''); setLastCost(null);
    try{
      const { data } = await api.post(`/trucks/${truckId}/config`, form);
      setLastCost(data.cost);
      setOpen(null);
      await onChanged();
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }finally{ setSaving(false); }
  }

  async function sellTruck(truckId){
    setSelling(truckId); setError(''); setSellMessage('');
    try{
      const { data } = await api.post(`/trucks/${truckId}/sell`);
      setSellMessage(data.message);
      await onChanged();
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }finally{ setSelling(null); }
  }

  async function performMaintenance(truckId, type){
    setMaintenanceLoading(true); setError('');
    try{
      const { data } = await api.post(`/trucks/${truckId}/maintenance`, { type });
      setSellMessage(data.message);
      await loadMaintenanceData(truckId);
      await onChanged(); // Refresh truck data
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }finally{
      setMaintenanceLoading(false);
    }
  }

  // Check if truck has active assignment
  function hasActiveAssignment(truckId) {
    return state?.assignments?.some(a => a.truckId === truckId && a.status === 'in_progress');
  }

  // Calculate estimated sell price with depreciation
  function getSellPrice(truck) {
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
    
    return Math.floor(baseValue * depreciationFactor);
  }

  // Handle tab change to load maintenance data when needed
  function handleTabChange(newTab) {
    setTab(newTab);
    if (newTab === 'maintenance' && open && !maintenanceData && !maintenanceLoading) {
      loadMaintenanceData(open);
    }
  }

  return (
    <div className="space-y-2">
      {error && <div className="text-red-400 text-sm">{error}</div>}
      {sellMessage && <div className="text-green-400 text-sm">{sellMessage}</div>}
      
      {state?.trucks?.map(truck => (
        <div key={truck._id} className="border border-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{truck.brand} {truck.model} <span className="text-xs text-gray-400">({t(truck.category)})</span></div>
              
              <div className="text-sm text-gray-400">
                {t('odometer')}: {(truck.odometerKm || 0).toFixed(1)} km | {t('wear')}: {((truck.wear || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-gray-300">
                {t('sellValue')}: €{getSellPrice(truck).toLocaleString()} 
                {hasActiveAssignment(truck._id) && <span className="text-yellow-400 ml-2">({t('activeAssignment')})</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={()=>startEdit(truck)}>{t('mechanic')}</button>
              <button 
                className="btn btn-danger" 
                onClick={()=>sellTruck(truck._id)} 
                disabled={selling === truck._id || hasActiveAssignment(truck._id)}
              >
                {selling === truck._id ? t('selling') : t('sell')}
              </button>
            </div>
          </div>

          {open === truck._id && (
            <div className="mt-3 border-t border-white/10 pt-3">
              {!opts ? <div className="text-sm text-gray-400">{t('loadingOptions')}</div> : (
                <>
                  <div className="flex gap-2 mb-3">
                    {SUBTABS.map(s => <button key={s} className={`tab ${tab===s?'tab-active':''}`} onClick={()=>handleTabChange(s)}>{t(s)}</button>)}
                  </div>

                  {tab==='performance' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Select label={t('engine')} value={form.engineId} onChange={v=>update('engineId', v)} options={opts.options.engine.map(o=>[o.id, o.label])} />
                      <Select label={t('induction')} value={form.induction} onChange={v=>update('induction', v)} options={opts.options.induction.map(o=>[o.id, o.label])} />
                    </div>
                  )}

                  {tab==='chassis' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Select label={t('wheelbase')} value={form.wheelbase} onChange={v=>update('wheelbase', v)} options={opts.options.wheelbase.map(o=>[o.id, o.label])} />
                    </div>
                  )}

                  {tab==='cargo' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Select label={t('body')} value={form.body} onChange={v=>update('body', v)} options={opts.options.body.map(o=>[o.id, o.label])} />
                    </div>
                  )}

                  {tab==='tyresGearbox' && (
                    <div className="grid grid-cols-2 gap-3">
                      <Select label={t('gearbox')} value={form.gearbox} onChange={v=>update('gearbox', v)} options={opts.options.gearbox.map(o=>[o.id, o.label])} />
                      <Select label={t('tyre')} value={form.tire} onChange={v=>update('tire', v)} options={opts.options.tire.map(o=>[o.id, o.label])} />
                    </div>
                  )}

                  {tab==='maintenance' && (
                    <div className="space-y-3">
                      {maintenanceLoading ? (
                        <div className="text-sm text-gray-400">{t('loadingMaintenanceData')}</div>
                      ) : maintenanceData ? (
                        <>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <div className="font-medium mb-2">{t('vehicleStatus')}</div>
                              <div>{t('odometer')}: {(maintenanceData.odometerKm || 0).toFixed(1)} km</div>
                              <div>{t('wearLevel')}: {((maintenanceData.wear || 0) * 100).toFixed(1)}%</div>
                              <div className={(maintenanceData.oilChangeOverdue || false) ? 'text-red-400' : 'text-green-400'}>
                                {t('oilChange')}: {(maintenanceData.kmSinceOilChange || 0).toFixed(1)} km ago
                                {(maintenanceData.oilChangeOverdue || false) && ` (${t('overdue')})`}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium mb-2">{t('maintenanceOptions')}</div>
                              <div className="space-y-2">
                                <button 
                                  className="btn btn-sm w-full" 
                                  onClick={() => performMaintenance(truck._id, 'oil_change')}
                                  disabled={maintenanceLoading}
                                >
                                  {t('oilChange')} (€{(maintenanceData.costs?.oilChange || 0)})
                                </button>
                                <button 
                                  className="btn btn-sm w-full" 
                                  onClick={() => performMaintenance(truck._id, 'basic')}
                                  disabled={maintenanceLoading}
                                >
                                  {t('basicService')} (€{(maintenanceData.costs?.basicMaintenance || 0)})
                                </button>
                                <button 
                                  className="btn btn-sm w-full" 
                                  onClick={() => performMaintenance(truck._id, 'major')}
                                  disabled={maintenanceLoading}
                                >
                                  {t('majorService')} (€{(maintenanceData.costs?.majorService || 0)})
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {maintenanceData.records && maintenanceData.records.length > 0 && (
                            <div>
                              <div className="font-medium mb-2">{t('recentMaintenance')}</div>
                              <div className="space-y-1 max-h-32 overflow-y-auto">
                                {maintenanceData.records.slice(-5).reverse().map((record, idx) => (
                                  <div key={idx} className="text-xs text-gray-400 flex justify-between">
                                    <span>{record.type.replace('_', ' ')} at {(record.odometerKm || 0).toFixed(1)} km</span>
                                    <span>{new Date(record.date).toLocaleDateString()}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-sm text-gray-400">{t('failedToLoadMaintenanceData')}</div>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex items-center justify-between">
                    <div className="text-sm text-gray-300">{t('estimatedCost')}: €{estimateCost().toLocaleString()}</div>
                    <div className="flex gap-2">
                      <button className="btn" onClick={()=>{ setOpen(null); }}>{t('cancel')}</button>
                      <button className="btn btn-primary" onClick={()=>save(truck._id)} disabled={saving}>{saving?t('saving'):t('save')}</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
      {(state?.trucks?.length||0)===0 && <div className="text-sm text-gray-400">{t('noTrucks')}</div>}
      {lastCost!=null && <div className="text-sm text-green-400">{t('lastModificationCost')}: €{lastCost.toLocaleString()}</div>}
    </div>
  );
}