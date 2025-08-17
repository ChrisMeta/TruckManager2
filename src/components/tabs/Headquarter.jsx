import React, { useState } from 'react';
import { api } from '../../api/client';

export default function Headquarter({ state, placingHQ, onPlaceToggle, onRefresh, onPreview }){
  const profile = state?.profile || { cash:0, level:1, xp:0, premium:0 };
  const hq = state?.stations?.find(s => s.type === 'hq');

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
    </div>
  );
}

function Stat({ title, value, sub }){
  return (
    <div className="text-center">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="font-semibold">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}