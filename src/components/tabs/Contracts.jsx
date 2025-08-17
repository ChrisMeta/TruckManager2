import React, { useState } from 'react';
import { api } from '../../api/client';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Contracts({ state, onChanged, onPreview }){
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [openRow, setOpenRow] = useState(null); // contractId expanded inline
  const [tab, setTab] = useState('open');
  const [error, setError] = useState('');

  const openContracts = state?.contracts?.filter(c => c.status === 'open') || [];
  const activeAssignments = state?.assignments?.filter(a => a.status === 'in_progress') || [];
  const completedContracts = state?.contracts?.filter(c => c.status === 'completed') || [];

  async function generate(){
    setError('');
    setGenerating(true);
    try {
      await api.post('/contracts/generate');
      await onChanged();
    } catch(e){
      setError(e.response?.data?.error || e.message);
    } finally { setGenerating(false); }
  }

  async function generateContract(){
    setGenerating(true);
    try{
      await api.post('/contracts/generate');
      await onChanged();
    }catch(e){
      console.error(e);
    }finally{
      setGenerating(false);
    }
  }

  async function previewRoute(contractId){
    setError('');
    try{
      const { data } = await api.get(`/contracts/${contractId}/route`);
      onPreview && onPreview(data.route);
    }catch(e){
      setError(e.response?.data?.error || e.message);
    }
  }

  async function accept(contractId, truckId){
    setError('');
    setLoading(true);
    try{
      await api.post(`/contracts/${contractId}/assign`, { truckId });
      onPreview && onPreview(null); // clear preview
      await onChanged();
      setOpenRow(null);
    } catch(e){
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
  }

  async function assignContract(contractId, truckId){
    try{
      await api.post(`/contracts/${contractId}/assign`, { truckId });
      await onChanged();
    }catch(e){
      console.error(e);
    }
  }

  async function instantComplete(contract){
    setError(''); setLoading(true);
    try{
      const running = (state.assignments||[]).find(a => a.contractId === contract._id && a.status === 'in_progress');
      if (!running) { setError('No active assignment for this contract.'); setLoading(false); return; }
      await api.post(`/assignments/${running._id}/instant-complete`);
      await onChanged();
    }catch(e){ setError(e.response?.data?.error || e.message); }
    finally{ setLoading(false); }
  }

  async function collect(contractId){
    setError(''); setLoading(true);
    try{
      await api.post(`/contracts/${contractId}/collect`);
      await onChanged();
    }catch(e){ setError(e.response?.data?.error || e.message); }
    finally{ setLoading(false); }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button className={`tab ${tab==='open'?'tab-active':''}`} onClick={()=>setTab('open')}>{t('openContracts')}</button>
        <button className={`tab ${tab==='active'?'tab-active':''}`} onClick={()=>setTab('active')}>{t('activeAssignments')}</button>
        <button className={`tab ${tab==='completed'?'tab-active':''}`} onClick={()=>setTab('completed')}>{t('completedContracts')}</button>
      </div>

      {tab === 'open' && (
        <div className="space-y-2">
          <button className="btn btn-primary w-full" onClick={generateContract} disabled={generating}>
            {generating ? t('generating') : t('generateContract')}
          </button>
          {openContracts.map(c => (
            <div key={c._id} className="border border-white/10 rounded-xl p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{t('from')}: {c.origin?.name} → {t('to')}: {c.destination?.name}</div>
                  <div className="text-sm text-gray-400">{t('cargo')}: {c.cargoType} • {t('distance')}: {c.distanceKm?.toFixed(1)}km</div>
                  <div className="text-sm text-gray-300">{t('reward')}: €{c.payout?.toLocaleString()} • {t('deadline')}: {new Date(c.deadline).toLocaleDateString()}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={() => previewRoute(c._id)}>{t('preview')}</button>
                  <select className="btn" onChange={(e) => e.target.value && assignContract(c._id, e.target.value)}>
                    <option value="">{t('assign')}</option>
                    {state?.trucks?.filter(t => t.status === 'idle').map(t => (
                      <option key={t._id} value={t._id}>{t.brand} {t.model}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
          {openContracts.length === 0 && <div className="text-sm text-gray-400">{t('noOpenContracts')}</div>}
        </div>
      )}

      {tab === 'active' && (
        <div className="space-y-2">
          {activeAssignments.map(a => {
            const contract = state?.contracts?.find(c => c._id === a.contractId);
            const truck = state?.trucks?.find(t => t._id === a.truckId);
            return (
              <div key={a._id} className="border border-white/10 rounded-xl p-3">
                <div className="font-medium">{contract?.origin?.name} → {contract?.destination?.name}</div>
                <div className="text-sm text-gray-400">{t('truck')}: {truck?.brand} {truck?.model}</div>
                <div className="text-sm text-gray-300">{t('progress')}: {(a.progress * 100).toFixed(1)}%</div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{width: `${a.progress * 100}%`}}></div>
                </div>
              </div>
            );
          })}
          {activeAssignments.length === 0 && <div className="text-sm text-gray-400">{t('noActiveAssignments')}</div>}
        </div>
      )}

      {tab === 'completed' && (
        <div className="space-y-2">
          {completedContracts.map(c => (
            <div key={c._id} className="border border-white/10 rounded-xl p-3">
              <div className="font-medium">{c.origin?.name} → {c.destination?.name}</div>
              <div className="text-sm text-gray-400">{t('cargo')}: {c.cargoType} • {t('reward')}: €{c.payout?.toLocaleString()}</div>
              <div className="text-sm text-green-400">{t('status')}: {c.status}</div>
            </div>
          ))}
          {completedContracts.length === 0 && <div className="text-sm text-gray-400">{t('noCompletedContracts')}</div>}
        </div>
      )}
    </div>
  );
}