import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickHandler({ placingHQ, onSetHQ }){
  useMapEvents({ click(e){ if (placingHQ) onSetHQ && onSetHQ(e.latlng); } });
  return null;
}

export default function MapView({ state, onSetHQ, placingHQ, previewRoute }){
  const hq = state?.stations?.find(s => s.type === 'hq');
  return (
    <MapContainer center={[52.52, 13.405]} zoom={6} className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler placingHQ={placingHQ} onSetHQ={onSetHQ} />
      {hq && (<><Marker position={[hq.location.lat, hq.location.lng]}><Popup><b>HQ</b><br/>Use the Headquarter tab to relocate.</Popup></Marker><Circle center={[hq.location.lat, hq.location.lng]} radius={(hq.radiusKm||2)*1000} /></>)}
      {state?.trucks?.map(t => (
        <Marker key={t._id} position={[t.location.lat, t.location.lng]}>
          <Popup><div className="space-y-1"><div className="font-semibold">{t.brand} {t.model}</div><div>Energy: {t.currentEnergy?.toFixed?.(1)}</div><div>Status: {t.status}</div></div></Popup>
        </Marker>
      ))}
      {state?.assignments?.map(a => (<Polyline key={a._id} positions={a.route.map(p=>[p.lat,p.lng])}/>))}
      {previewRoute && previewRoute.length > 1 && (<Polyline positions={previewRoute.map(p=>[p.lat,p.lng])} />)}
      {placingHQ && (
        <div className="leaflet-top leaflet-right">
          <div className="leaflet-control p-2 rounded-lg bg-yellow-500/90 text-black text-sm shadow">
            Click on the map to set HQ location
          </div>
        </div>
      )}
    </MapContainer>
  );
}
