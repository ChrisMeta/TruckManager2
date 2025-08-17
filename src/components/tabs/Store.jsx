import React from 'react';
import { api } from '../../api/client';

const bundles = [
  { euros: 10000, gems: 10 },
  { euros: 50000, gems: 50 },
  { euros: 100000, gems: 100 },
  { euros: 1000000, gems: 1000 },
];

export default function Store({ state, onChanged }){
  const premium = state?.profile?.premium ?? 0;
  async function buy(b){
    await api.post('/premium/convert', { gems: b.gems, to: 'cash' });
    await onChanged && onChanged();
  }
  return (
    <div className="space-y-3">
      <div className="h">Premium Store</div>
      <div className="text-sm text-gray-400">Your balance: <b>{premium}★</b></div>
      <div className="grid grid-cols-1 gap-2">
        {bundles.map(b => (
          <div key={b.euros} className="border border-white/10 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="font-medium">€{b.euros.toLocaleString()}</div>
              <div className="text-sm text-gray-400">{b.gems}★</div>
            </div>
            <button className="btn btn-primary" onClick={()=>buy(b)}>Buy with {b.gems}★</button>
          </div>
        ))}
      </div>
    </div>
  );
}
