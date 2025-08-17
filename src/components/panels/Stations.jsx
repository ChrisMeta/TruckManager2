import React from 'react';

export default function Stations({ state }){
  return (
    <div className="space-y-2">
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
      {state?.stations?.length===0 && <div className="text-sm text-gray-400">Click on the map to set HQ, or use the button to add a fuel station.</div>}
    </div>
  );
}
