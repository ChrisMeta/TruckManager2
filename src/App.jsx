import React, { useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { API_BASE, api } from './api/client';
import MapView from './components/MapView';
import Headquarter from './components/tabs/Headquarter.jsx';
import Shop from './components/tabs/Shop.jsx';
import Garage from './components/tabs/Garage';
import Contracts from './components/tabs/Contracts';
import Store from './components/tabs/Store';
import Fleet from './components/panels/Fleet.jsx';
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
  const [activeTab, setActiveTab] = useState('headquarter');
  const [loading, setLoading] = useState(true);
  const [previewRoute, setPreviewRoute] = useState(null); // [{lat,lng},...]
  const [placingHQ, setPlacingHQ] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [panelWidth, setPanelWidth] = useState(320); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  
  const resizeRef = useRef(null);
  const panelRef = useRef(null);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // Reset panel width on mobile
      if (isMobileDevice) {
        setPanelWidth(320);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle panel resizing
  const handleMouseDown = useCallback((e) => {
    if (isMobile) return;
    
    setIsResizing(true);
    e.preventDefault();
    
    const startX = e.clientX;
    const startWidth = panelWidth;
    
    const handleMouseMove = (e) => {
      const deltaX = startX - e.clientX; // Reverse direction since we're resizing from the left edge
      const newWidth = Math.max(250, Math.min(600, startWidth + deltaX)); // Min 250px, max 600px
      
      // Don't let panel exceed 80% of screen width
      const maxWidth = window.innerWidth * 0.8;
      setPanelWidth(Math.min(newWidth, maxWidth));
    };
    
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [isMobile, panelWidth]);

  // Prevent text selection while resizing
  useEffect(() => {
    if (isResizing) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'ew-resize';
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    
    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing]);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
    <div className="h-screen w-screen overflow-hidden relative">
      {/* Mobile Menu Toggle Button - Only show when menu is closed */}
      {isMobile && !isMobileMenuOpen && (
        <button
          onClick={toggleMobileMenu}
          className="fixed top-4 right-4 z-[9999] btn btn-primary shadow-lg"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      )}

      {/* Main Content Area */}
      <div className="h-full w-full flex">
        {/* Map/Main Content */}
        <div 
          className={`flex-1 ${isMobile && isMobileMenuOpen ? 'hidden' : 'block'}`}
          style={!isMobile ? { width: `calc(100% - ${panelWidth}px)` } : {}}
        >
          <MapView state={state} previewRoute={previewRoute} placingHQ={placingHQ} onSetHQ={handleSetHQ} />
        </div>

        {/* Side Panel */}
        <div 
          ref={panelRef}
          className={`
            ${isMobile 
              ? `fixed inset-0 z-40 bg-gray-900 ${isMobileMenuOpen ? 'block' : 'hidden'}`
              : 'relative'
            }
            flex flex-col border-l border-white/10 bg-gray-900
          `}
          style={!isMobile ? { width: `${panelWidth}px`, minWidth: `${panelWidth}px` } : {}}
        >
          {/* Resize Handle - Desktop Only */}
          {!isMobile && (
            <div
              ref={resizeRef}
              className={`
                absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize z-10
                hover:bg-accent/50 transition-colors
                ${isResizing ? 'bg-accent' : 'bg-transparent'}
              `}
              onMouseDown={handleMouseDown}
              title="Drag to resize panel"
            >
              {/* Visual indicator */}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r"></div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className={`
            flex items-center border-b border-white/10 bg-gray-800/50 p-2
            ${isMobile ? 'gap-0.5' : 'gap-1 overflow-x-auto'}
          `}>
            {TABS.map(tab => {
              const displayName = t(tab);
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`
                    tab whitespace-nowrap capitalize
                    ${activeTab === tab ? 'tab-active' : ''}
                    ${isMobile 
                      ? 'flex-1 min-w-0 px-1.5 py-1.5 text-xs overflow-hidden text-ellipsis' 
                      : 'px-3 py-2 text-sm'
                    }
                  `}
                  title={isMobile && displayName.length > 8 ? displayName : undefined}
                >
                  {displayName}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className={`
            flex-1 overflow-y-auto p-4
            ${isMobile ? 'pb-16' : ''}
          `}>
            {activeTab === 'headquarter' && (
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
            {activeTab === 'shop' && <div className="card"><Shop state={state} onBought={async()=>{ setPreviewRoute(null); await refresh(); }} /></div>}
            {activeTab === 'garage' && <div className="card"><Garage state={state} onChanged={async()=>{ await refresh(); }} /></div>}
            {activeTab === 'contracts' && (
              <div className="card">
                <Contracts
                  state={state}
                  onChanged={async()=>{ await refresh(); }}
                  onPreview={setPreviewRoute}
                />
              </div>
            )}
            {activeTab === 'store' && <div className="card"><Store state={state} onChanged={refresh} /></div>}
          </div>

          {/* Mobile Close Button - Bottom floating */}
          {isMobile && isMobileMenuOpen && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
              <button
                onClick={toggleMobileMenu}
                className="btn btn-primary shadow-lg px-4 py-2"
                aria-label="Close menu"
              >
                {t('close')} ✕
              </button>
            </div>
          )}

          {/* Panel Width Indicator - Desktop Only */}
          {!isMobile && isResizing && (
            <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
              {panelWidth}px
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay Background */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={toggleMobileMenu}
        />
      )}
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