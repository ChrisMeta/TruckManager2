import React from 'react';
import { api } from '../../api/client';

export default function Stations({ state, onChanged }){
  async function addFuel(){ await api.post('/stations', {type:'fuel', name:'Fuel Stop', location:{lat:52.48,lng:13.4}, radiusKm:1}); onChanged && onChanged(); }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="h">Stations</div>
        <button className="btn" onClick={addFuel}>Add Fuel near Berlin</button>
      </div>
      {state?.stations?.map(s => (
        <div key={s._id} className="border border-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{s.name || s.type.toUpperCase()}</div>
              <div className="text-sm text-gray-400">{s.type} — r={s.radiusKm}km @ {s.location.lat.toFixed(3)}, {s.location.lng.toFixed(3)}</div>
            </div>
          </div>
        </div>
      ))}
      {(state?.stations?.length||0)===0 && <div className="text-sm text-gray-400">Click on the map to set HQ, or add a fuel station.</div>}
    </div>
  );
}
