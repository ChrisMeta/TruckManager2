import React from 'react';

export default function Fleet({ state, onAssign }){
  const openContracts = state?.contracts?.filter(c=>c.status==='open') || [];
  return (
    <div className="space-y-2">
      {state?.trucks?.map(t => (
        <div key={t._id} className="border border-white/10 rounded-xl p-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-medium">{t.brand} {t.model} <span className="text-xs text-gray-400">({t.category})</span></div>
              <div className="text-sm text-gray-400">
                Energy {t.currentEnergy?.toFixed?.(1)} | Wear {(t.wear*100).toFixed(0)}% | {t.status}
              </div>
            </div>
            <div className="flex gap-2">
              {t.status === 'idle' && openContracts[0] && (
                <button className="btn" onClick={() => onAssign(t._id, openContracts[0]._id)}>
                  Assign to first
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
      {state?.trucks?.length===0 && <div className="text-sm text-gray-400">No trucks yet. Click "Buy default".</div>}
    </div>
  );
}
