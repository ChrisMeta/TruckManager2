import React from 'react';

export default function Dashboard({ state }){
  const cash = state?.profile?.cash;
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="bg-white/5 p-3 rounded-xl">
        <div className="sub">Cash</div>
        <div className="text-2xl font-bold">{cash !== undefined ? `€${cash.toLocaleString()}` : '—'}</div>
      </div>
      <div className="bg-white/5 p-3 rounded-xl">
        <div className="sub">Trucks</div>
        <div className="text-2xl font-bold">{state?.trucks?.length || 0}</div>
      </div>
      <div className="bg-white/5 p-3 rounded-xl">
        <div className="sub">Contracts</div>
        <div className="text-2xl font-bold">{state?.contracts?.length || 0}</div>
      </div>
    </div>
  );
}
