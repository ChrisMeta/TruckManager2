import React from 'react';

export default function Contracts({ state }){
  return (
    <div className="space-y-2">
      {state?.contracts?.map(c => (
        <div key={c._id} className="border border-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{c.cargoType} — {c.origin?.name} → {c.destination?.name}</div>
              <div className="text-sm text-gray-400">{c.distanceKm?.toFixed?.(1)} km | Payout €{c.payout}
                {c.status!=='open' && <span className="ml-2 text-accent">{c.status}</span>}
              </div>
            </div>
            <div className="text-sm text-gray-400">{new Date(c.deadline).toLocaleString()}</div>
          </div>
        </div>
      ))}
      {state?.contracts?.length===0 && <div className="text-sm text-gray-400">No contracts yet. Click "Generate".</div>}
    </div>
  );
}
