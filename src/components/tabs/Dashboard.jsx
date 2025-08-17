import React from 'react';

export default function Dashboard({ state }){
  const cash = state?.profile?.cash ?? 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat title="Cash" value={`€${cash.toLocaleString()}`} />
        <Stat title="Trucks" value={state?.trucks?.length || 0} />
        <Stat title="Contracts" value={state?.contracts?.length || 0} />
      </div>
      <div className="sub">Recent Assignments</div>
      <div className="space-y-2">
        {state?.assignments?.slice(0,5).map(a => (
          <div key={a._id} className="border border-white/10 rounded-xl p-2 text-sm">
            Progress: {(a.progress*100).toFixed(1)}% — {a.status}
          </div>
        ))}
        {(state?.assignments?.length||0)===0 && <div className="text-sm text-gray-500">No assignments yet.</div>}
      </div>
    </div>
  );
}
function Stat({ title, value }){
  return (
    <div className="bg-white/5 p-3 rounded-xl">
      <div className="sub">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
