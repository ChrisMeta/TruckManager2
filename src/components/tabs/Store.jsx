import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../api/client';

export default function Store({ state, onChanged }){
  const { t } = useLanguage();
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function convertPremiumToCash(premiumAmount){
    setConverting(true); setError(''); setSuccess('');
    try{
      const { data } = await api.post('/premium/convert', { 
        gems: premiumAmount, 
        to: 'cash' 
      });
      setSuccess(t('premiumConverted'));
      await onChanged();
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }finally{
      setConverting(false);
    }
  }

  const profile = state?.profile || { cash: 0, premium: 0 };

  return (
    <div className="space-y-3">
      <div className="border border-white/10 rounded-xl p-3">
        <div className="font-medium mb-2">{t('convertPremiumToCash')}</div>
        <div className="text-sm text-gray-400 mb-3">
          {t('currentBalance')}: {profile.premium || 0}★ | {t('cash')}: €{(profile.cash || 0).toLocaleString()}
        </div>
        
        {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-400 text-sm mb-2">{success}</div>}
        
        <div className="space-y-2">
          <div className="flex items-center justify-between p-2 border border-white/10 rounded">
            <div>
              <div className="font-medium">{t('convert')} 100★</div>
              <div className="text-sm text-gray-400">{t('receive')} €100</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => convertPremiumToCash(100)}
              disabled={converting || profile.premium < 100}
            >
              {converting ? t('converting') : t('convert')}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-2 border border-white/10 rounded">
            <div>
              <div className="font-medium">{t('convert')} 500★</div>
              <div className="text-sm text-gray-400">{t('receive')} €500</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => convertPremiumToCash(500)}
              disabled={converting || profile.premium < 500}
            >
              {converting ? t('converting') : t('convert')}
            </button>
          </div>
          
          <div className="flex items-center justify-between p-2 border border-white/10 rounded">
            <div>
              <div className="font-medium">{t('convert')} 1000★</div>
              <div className="text-sm text-gray-400">{t('receive')} €1000</div>
            </div>
            <button 
              className="btn btn-primary" 
              onClick={() => convertPremiumToCash(1000)}
              disabled={converting || profile.premium < 1000}
            >
              {converting ? t('converting') : t('convert')}
            </button>
          </div>
        </div>
      </div>
      
      <div className="border border-white/10 rounded-xl p-3">
        <div className="font-medium mb-2">{t('premiumBenefits')}</div>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• {t('buyTrucksWithPremium')}</li>
          <li>• {t('fasterContractGeneration')}</li>
          <li>• {t('exclusiveContent')}</li>
        </ul>
      </div>
    </div>
  );
}