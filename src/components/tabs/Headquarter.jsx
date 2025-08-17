import React, { useState } from 'react';
import { api } from '../../api/client';

export default function Headquarter({ state, placingHQ, onPlaceToggle, onRefresh, onPreview }){
  const profile = state?.profile || { cash:0, level:1, xp:0, premium:0 };
  const hq = state?.stations?.find(s => s.type === 'hq');
  const [amount, setAmount] = useState(1000);
  const [err, setErr] = useState('');

  async function convert(){
    setErr('');
    try{
      await api.post('/premium/convert', { gems: 1 * Math.ceil(amount/1000), to: 'cash' });
      await onRefresh();
    }catch(e){ setErr(e.response?.data?.error || e.message); }
  }

  async function instantComplete(){
    setErr('');
    try{
      // Choose the earliest in_progress assignment (simple UX for now)
      const running = (state.assignments||[]).find(a => a.status === 'in_progress');
      if (!running) { setErr('No active assignment.'); return; }
      await api.post(`/assignments/${running._id}/instant-complete`);
      onPreview && onPreview(null);
      await onRefresh();
    }catch(e){ setErr(e.response?.data?.error || e.message); }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Stat title="Cash" value={`€${(profile.cash||0).toLocaleString()}`} />
        <Stat title="Premium" value={`${profile.premium||0}★`} />
        <Stat title="Level" value={`${profile.level||1}`} sub={`XP ${(profile.xp||0)}`} />
      </div>

      <div className="border border-white/10 rounded-xl p-3">
        <div className="h mb-2">Headquarter</div>
        <div className="text-sm text-gray-400 mb-2">
          {hq ? <>Current HQ at {hq.location.lat.toFixed(3)}, {hq.location.lng.toFixed(3)}.</> : <>HQ not placed yet.</>}
        </div>
        <div className="flex gap-2">
          {!hq
            ? <button className={`btn ${placingHQ?'bg-white/10':''}`} onClick={onPlaceToggle}>{placingHQ?'Click on Map…':'Place HQ'}</button>
            : <button className={`btn ${placingHQ?'bg-white/10':''}`} onClick={onPlaceToggle}>{placingHQ?'Click on Map…':'Relocate HQ'}</button>
          }
        </div>
      </div>

      <div className="border border-white/10 rounded-xl p-3">
        <div className="h mb-2">Premium Actions</div>
        <div className="text-sm text-gray-400 mb-2">You can’t buy premium yet, but you can spend it:</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="border border-white/10 rounded-lg p-2">
            <div className="font-medium mb-1">Convert to Cash</div>
            <div className="text-xs text-gray-400 mb-1">1★ → €1,000</div>
            <div className="flex gap-2">
              <input className="input" type="number" min="1000" step="1000" value={amount} onChange={e=>setAmount(Number(e.target.value)||1000)} />
              <button className="btn btn-primary" onClick={convert}>Buy Cash</button>
            </div>
          </div>
          <div className="border border-white/10 rounded-lg p-2">
            <div className="font-medium mb-1">Instant-Complete</div>
            <div className="text-xs text-gray-400 mb-1">Finish the current route with ★</div>
            <button className="btn" onClick={instantComplete}>Complete Active Route</button>
          </div>
        </div>
        {err && <div className="text-sm text-red-400 mt-2">{err}</div>}
      </div>
    </div>
  );
}

function Stat({ title, value, sub }){
  return (
    <div className="bg-white/5 p-3 rounded-xl">
      <div className="sub">{title}</div>
      <div className="text-2xl font-bold">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}
