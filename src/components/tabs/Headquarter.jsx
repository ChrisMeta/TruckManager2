import React, { useState } from 'react';
import { api } from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Headquarter({ state, placingHQ, onPlaceToggle, onRefresh, onPreview }){
  const { t } = useLanguage();
  const profile = state?.profile || { cash:0, level:1, xp:0, premium:0 };
  const hq = state?.stations?.find(s => s.type === 'hq');

  return (
    <div className="space-y-3">
      {/* Language Switcher */}
      <LanguageSwitcher />
      
      <div className="grid grid-cols-3 gap-3">
        <Stat title={t('cash')} value={`€${(profile.cash||0).toLocaleString()}`} />
        <Stat title={t('premium')} value={`${profile.premium||0}★`} />
        <Stat title={t('level')} value={`${profile.level||1}`} sub={`XP ${(profile.xp||0)}`} />
      </div>

      <div className="border border-white/10 rounded-xl p-3">
        <div className="h mb-2">{t('headquarter')}</div>
        <div className="text-sm text-gray-400 mb-2">
          {hq ? <>{t('currentHqAt')} {hq.location.lat.toFixed(3)}, {hq.location.lng.toFixed(3)}.</> : <>{t('hqNotPlacedYet')}.</>}
        </div>
        <div className="flex gap-2">
          {!hq
            ? <button className={`btn ${placingHQ?'bg-white/10':''}`} onClick={onPlaceToggle}>{placingHQ?t('clickOnMap'):t('placeHq')}</button>
            : <button className={`btn ${placingHQ?'bg-white/10':''}`} onClick={onPlaceToggle}>{placingHQ?t('clickOnMap'):t('relocateHq')}</button>
          }
        </div>
      </div>
    </div>
  );
}

function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();
  
  return (
    <div className="flex justify-end mb-2">
      <select 
        className="bg-[#0b0e14] border border-white/10 rounded-lg px-2 py-1 text-sm text-gray-100"
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="en">🇺🇸 EN</option>
        <option value="de">🇩🇪 DE</option>
      </select>
    </div>
  );
}

function Stat({ title, value, sub }){
  return (
    <div className="border border-white/10 rounded-xl p-3 text-center">
      <div className="text-sm text-gray-400">{title}</div>
      <div className="font-medium">{value}</div>
      {sub && <div className="text-xs text-gray-500">{sub}</div>}
    </div>
  );
}