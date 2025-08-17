import axios from 'axios';
export async function nearbyPlaces(lat, lng, radiusKm=100, limit=30){
  const base = process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter';
  const radius = Math.floor(radiusKm * 1000);
  const q = `[out:json][timeout:25];
(
  node(around:${radius},${lat},${lng})[place~"city|town|village"];
);
out body ${limit};`;
  const { data } = await axios.post(base, q, { headers: { 'Content-Type': 'text/plain' } });
  if (!data?.elements) return [];
  const places = data.elements.map(e => ({
    name: (e.tags && (e.tags.name || e.tags['name:en'])) || 'Unknown',
    lat: e.lat, lng: e.lon
  })).filter(p => p.name && p.lat && p.lng);
  const seen = new Set();
  const unique = [];
  for (const p of places){
    const k = `${p.name}|${p.lat.toFixed(3)}|${p.lng.toFixed(3)}`;
    if (!seen.has(k)){ seen.add(k); unique.push(p); }
  }
  for (let i=unique.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [unique[i],unique[j]]=[unique[j],unique[i]]; }
  return unique.slice(0, limit);
}
