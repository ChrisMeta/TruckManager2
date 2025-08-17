import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ClickHandler({ placingHQ, onSetHQ }) {
  useMapEvents({
    click: (e) => {
      if (placingHQ && onSetHQ) {
        onSetHQ(e.latlng);
      }
    }
  });
  return null;
}

export default function MapView({ state, previewRoute, placingHQ, onSetHQ }) {
  const hq = state?.stations?.find(s => s.type === 'hq');
  const center = hq ? [hq.location.lat, hq.location.lng] : [52.5200, 13.4050]; // Default to Berlin

  return (
    <MapContainer center={center} zoom={6} className="h-full w-full">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickHandler placingHQ={placingHQ} onSetHQ={onSetHQ} />
      
      {/* HQ */}
      {hq && (
        <Marker position={[hq.location.lat, hq.location.lng]}>
          <Popup>HQ: {hq.name}</Popup>
        </Marker>
      )}

      {/* Trucks - only show trucks that have a location */}
      {state?.trucks?.filter(t => t.location && t.location.lat && t.location.lng).map(t => (
        <Marker key={t._id} position={[t.location.lat, t.location.lng]}>
          <Popup>
            <div>
              <div className="font-medium">{t.brand} {t.model}</div>
              <div className="text-sm">Status: {t.status}</div>
              <div className="text-sm">Energy: {t.currentEnergy?.toFixed?.(1) || 0}</div>
              <div className="text-sm">Wear: {((t.wear || 0) * 100).toFixed(1)}%</div>
              <div className="text-sm">Odometer: {(t.odometerKm || 0).toLocaleString()} km</div>
              {t.lastOilChangeKm !== undefined && (
                <div className="text-sm">
                  Oil change: {((t.odometerKm || 0) - (t.lastOilChangeKm || 0)).toLocaleString()} km ago
                  {((t.odometerKm || 0) - (t.lastOilChangeKm || 0)) >= 40000 && 
                    <span className="text-red-500 ml-1">⚠️ OVERDUE</span>
                  }
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Stations */}
      {state?.stations?.filter(s => s.type !== 'hq').map(s => (
        <Marker key={s._id} position={[s.location.lat, s.location.lng]}>
          <Popup>{s.type}: {s.name}</Popup>
        </Marker>
      ))}

      {/* Preview route */}
      {previewRoute && previewRoute.length > 1 && (
        <Polyline positions={previewRoute.map(p => [p.lat, p.lng])} color="blue" weight={3} opacity={0.7} />
      )}

      {/* Assignment routes */}
      {state?.assignments?.filter(a => a.status === 'in_progress' && a.route).map(a => (
        <Polyline key={a._id} positions={a.route.map(p => [p.lat, p.lng])} color="green" weight={2} opacity={0.8} />
      ))}
    </MapContainer>
  );
}