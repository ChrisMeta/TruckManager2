import React, { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, api } from './api/client';
import MapView from './components/MapView';
import Headquarter from './components/tabs/Headquarter';
import Shop from './components/tabs/Shop';
import Garage from './components/tabs/Garage';
import Contracts from './components/tabs/Contracts';
import Store from './components/tabs/Store';
import LoginForm from './components/auth/LoginForm';
import RegisterForm from './components/auth/RegisterForm';

const TABS = ['Headquarter','Shop','Garage','Contracts','Store'];

export default function App(){
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ profile:null, trucks:[], assignments:[], contracts:[], stations:[] });
  const [tab, setTab] = useState('Headquarter');
  const [loading, setLoading] = useState(true);
  const [previewRoute, setPreviewRoute] = useState(null); // [{lat,lng},...]
  const [placingHQ, setPlacingHQ] = useState(false);

  async function refresh(){
    try{
      const me = await api.get('/auth/me');
      if (me.data?.userId) {
        if (!user) setUser({ id: me.data.userId });
        const res = await api.get('/game/state');
        setState(res.data);
      } else {
        setUser(null);
      }
    } finally { setLoading(false); }
  }

  useEffect(() => {
    const s = io(API_BASE, { withCredentials: true });
    s.on('truck:update', refresh);
    s.on('assignment:update', refresh);
    s.on('contract:update', refresh);
    return () => s.disconnect();
    // eslint-disable-next-line
  }, []);

  useEffect(() => { refresh(); }, []); // on mount only

  useEffect(() => {
    function on401(){ setUser(null); setLoading(false); }
    window.addEventListener('api-unauthorized', on401);
    return () => window.removeEventListener('api-unauthorized', on401);
  }, []);

  const hq = state?.stations?.find(s => s.type === 'hq');

  if (loading) return <div className="min-h-screen grid place-items-center">Loading…</div>;

  if (!user){
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="card">
            <AuthSwitcher onLogin={()=>setUser({})}/>
          </div>
          <p className="text-sm text-gray-400 text-center">Trucking Simulator — Node Backend</p>
        </div>
      </div>
    );
  }

  async function handleSetHQ(latlng){
    if (!placingHQ) return; // ignore clicks unless armed
    await api.post('/stations/hq', { lat: latlng.lat, lng: latlng.lng, name:'HQ' });
    setPlacingHQ(false);
    setPreviewRoute(null);
    await refresh();
  }

  return (
    <div className="h-screen w-screen grid grid-cols-12">
      <div className="col-span-8 relative">
        <MapView state={state} previewRoute={previewRoute} placingHQ={placingHQ} onSetHQ={handleSetHQ} />
      </div>
      <div className="col-span-4 p-3 space-y-3 overflow-y-auto">
        <div className="card">
          <div className="flex gap-2">
            {TABS.map(t => (
              <button key={t} className={`tab ${tab===t?'tab-active':''}`} onClick={()=>setTab(t)}>{t}</button>
            ))}
          </div>
        </div>

        {tab === 'Headquarter' && (
          <div className="card">
            <Headquarter
              state={state}
              placingHQ={placingHQ}
              onPlaceToggle={() => setPlacingHQ(v => !v)}
              onRefresh={refresh}
              onPreview={setPreviewRoute}
            />
          </div>
        )}
        {tab === 'Shop' && <div className="card"><Shop state={state} onBought={async()=>{ setPreviewRoute(null); await refresh(); }} /></div>}
        {tab === 'Garage' && <div className="card"><Garage state={state} onChanged={async()=>{ await refresh(); }} /></div>}
        {tab === 'Contracts' && (
          <div className="card">
            <Contracts
              state={state}
              onChanged={async()=>{ await refresh(); }}
              onPreview={setPreviewRoute}
            />
          </div>
        )}
        {tab === 'Store' && <div className="card"><Store state={state} onChanged={refresh} /></div>}
      </div>
    </div>
  );
}

function AuthSwitcher({ onLogin }){
  const [mode, setMode] = useState('login');
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className={mode==='login'?'btn bg-white/10':'btn'} onClick={()=>setMode('login')}>Login</button>
        <button className={mode==='register'?'btn bg-white/10':'btn'} onClick={()=>setMode('register')}>Register</button>
      </div>
      {mode==='login'
        ? <LoginForm onLoggedIn={onLogin} />
        : <RegisterForm onRegistered={()=>setMode('login')} />}
    </div>
  );
}
