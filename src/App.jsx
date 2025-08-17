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
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';

const TABS = ['headquarter', 'shop', 'garage', 'contracts', 'store'];

export default function App(){
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

function AppContent() {
  const { t, language, setLanguage } = useLanguage();
  const [user, setUser] = useState(null);
  const [state, setState] = useState({ profile:null, trucks:[], assignments:[], contracts:[], stations:[] });
  const [tab, setTab] = useState('headquarter');
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

  if (loading) return <div className="min-h-screen grid place-items-center">{t('loading')}</div>;

  if (!user){
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="w-full max-w-md space-y-4">
          <div className="card">
            <AuthSwitcher onLogin={()=>setUser({})}/>
          </div>
          <p className="text-sm text-gray-400 text-center">{t('truckingSimulator')}</p>
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
          <div className="flex justify-between items-center mb-3">
            <div className="flex gap-2">
              {TABS.map(tabKey => (
                <button key={tabKey} className={`tab ${tab===tabKey?'tab-active':''}`} onClick={()=>setTab(tabKey)}>
                  {t(tabKey)}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              <button 
                className={`btn btn-sm ${language === 'en' ? 'bg-white/10' : ''}`} 
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button 
                className={`btn btn-sm ${language === 'de' ? 'bg-white/10' : ''}`} 
                onClick={() => setLanguage('de')}
              >
                DE
              </button>
            </div>
          </div>
        </div>

        {tab === 'headquarter' && (
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
        {tab === 'shop' && <div className="card"><Shop state={state} onBought={async()=>{ setPreviewRoute(null); await refresh(); }} /></div>}
        {tab === 'garage' && <div className="card"><Garage state={state} onChanged={async()=>{ await refresh(); }} /></div>}
        {tab === 'contracts' && (
          <div className="card">
            <Contracts
              state={state}
              onChanged={async()=>{ await refresh(); }}
              onPreview={setPreviewRoute}
            />
          </div>
        )}
        {tab === 'store' && <div className="card"><Store state={state} onChanged={refresh} /></div>}
      </div>
    </div>
  );
}

function AuthSwitcher({ onLogin }){
  const [mode, setMode] = useState('login');
  const { t } = useLanguage();
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <button className={mode==='login'?'btn bg-white/10':'btn'} onClick={()=>setMode('login')}>{t('login')}</button>
        <button className={mode==='register'?'btn bg-white/10':'btn'} onClick={()=>setMode('register')}>{t('register')}</button>
      </div>
      {mode==='login'
        ? <LoginForm onLoggedIn={onLogin} />
        : <RegisterForm onRegistered={()=>setMode('login')} />}
    </div>
  );
}