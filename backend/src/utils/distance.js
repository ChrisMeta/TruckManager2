export function toRad(val){ return (val * Math.PI) / 180; }
export function haversineKm(a, b){
  const R=6371; const dLat=toRad(b.lat-a.lat); const dLng=toRad(b.lng-a.lng);
  const lat1=toRad(a.lat), lat2=toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
}
export function interpolateRoute(a,b,points=200){
  const r=[]; for(let i=0;i<=points;i++){ const t=i/points; r.push({lat:a.lat+(b.lat-a.lat)*t, lng:a.lng+(b.lng-a.lng)*t}); }
  return r;
}
