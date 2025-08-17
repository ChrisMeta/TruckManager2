import React, { useState } from 'react';
import { api } from '../../api/client';

export default function Contracts({ state, onChanged, onPreview }){
  const [loading, setLoading] = useState(false);
  const [openRow, setOpenRow] = useState(null); // contractId expanded inline
  const [error, setError] = useState('');

  async function generate(){
    setError('');
    setLoading(true);
    try {
      await api.post('/contracts/generate');
      await onChanged();
    } catch(e){
      setError(e.response?.data?.error || e.message);
    } finally { setLoading(false); }
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
      <div className="flex items-center justify-between">
        <div className="h">Contracts</div>
        <div className="flex gap-2">
          <button className="btn" onClick={()=>onPreview && onPreview(null)}>Clear Preview</button>
          <button className="btn" onClick={generate} disabled={loading}>{loading ? 'Generating…' : 'Generate'}</button>
        </div>
      </div>
      {error && <div className="text-red-400 text-sm">{error}</div>}

      <div className="space-y-2">
        {state?.contracts?.map(c => (
          <div key={c._id} className="border border-white/10 rounded-xl">
            <div className="p-3 grid grid-cols-8 items-center gap-2">
              <div className="col-span-5">
                <div className="font-medium">{c.origin?.name} → {c.destination?.name}</div>
                <div className="text-sm text-gray-400">
                  {c.cargoType} • {c.distanceKm?.toFixed?.(1)} km • {c.weightTons}t • {c.volumeM3} m³ • €{c.payout}
                  <span className="ml-2 text-accent">{c.status}</span>
                  {c.status==='completed' && !c.paid && <span className="ml-2 text-yellow-300">Unpaid</span>}
                  {c.paid && <span className="ml-2 text-green-400">Paid</span>}
                </div>
              </div>
              <div className="col-span-3 flex justify-end gap-2">
                <button className="btn" onClick={()=>previewRoute(c._id)}>Preview</button>
                {c.status==='open' && (
                  <button className="btn btn-primary" onClick={()=>setOpenRow(openRow===c._id?null:c._id)}>
                    {openRow===c._id?'Cancel':'Accept'}
                  </button>
                )}
                {c.status==='in_progress' && (
                  <button className="btn" onClick={()=>instantComplete(c)}>Instant Complete ★</button>
                )}
                {c.status==='completed' && !c.paid && (
                  <button className="btn btn-primary" onClick={()=>collect(c._id)}>Collect €</button>
                )}
              </div>
            </div>

            {openRow === c._id && (
              <div className="border-t border-white/10 p-3">
                <div className="h mb-2">Select Truck</div>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {state?.trucks?.length ? state.trucks.map(t => (
                    <div key={t._id} className="border border-white/10 rounded-xl p-2 flex items-center justify-between">
                      <div>{t.brand} {t.model} <span className="text-xs text-gray-400">({t.speedKph} km/h)</span></div>
                      <button className="btn btn-primary" onClick={()=>accept(c._id, t._id)} disabled={loading}>
                        {loading ? 'Routing…' : 'Assign'}
                      </button>
                    </div>
                  )) : <div className="text-sm text-gray-400">No trucks available.</div>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
