import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

const CAT_TABS = ['van','box','rigid','semi'];

export default function Shop({ state, onBought }){
  const [catalog, setCatalog] = useState([]);
  const [cat, setCat] = useState('van');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { (async()=>{ const { data } = await api.get('/catalog'); setCatalog(data); })(); }, []);

  const items = catalog.filter(c => c.category === cat);

  async function buy(i, method='cash'){
    setError(''); setLoading(true);
    try{
      await api.post('/trucks/buy', { ...i, paymentMethod: method });
      onBought && onBought();
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }finally{ setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {CAT_TABS.map(t => <button key={t} className={`tab ${cat===t?'tab-active':''}`} onClick={()=>setCat(t)}>{t.toUpperCase()}</button>)}
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}
      <div className="grid grid-cols-1 gap-2">
        {items.map(i => {
          const gems = Math.ceil((i.price||0)/1000);
          return (
            <div key={`${i.brand}-${i.model}`} className="border border-white/10 rounded-xl p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{i.brand} {i.model}</div>
                <div className="text-sm text-gray-400">{i.fuelType} • {i.enginePowerKw}kW • {i.speedKph} km/h • cap {i.batteryKwh || i.fuelCapacityL}{i.fuelType==='electric'?'kWh':'L'}</div>
                <div className="text-sm text-gray-300 mt-1">€{i.price.toLocaleString()} <span className="text-xs text-gray-500 ml-2">or {gems}★</span></div>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={()=>buy(i,'cash')} disabled={loading}>{loading?'Buying…':'Buy (Cash)'}</button>
                <button className="btn" onClick={()=>buy(i,'premium')} disabled={loading}>Buy ({gems}★)</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
