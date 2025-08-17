import axios from 'axios';
export async function osrmRoute(origin, destination){
  const base = process.env.OSRM_URL || 'https://router.project-osrm.org';
  const url = `${base}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
  const { data } = await axios.get(url);
  if (!data?.routes?.length) throw new Error('OSRM: no route');
  const r = data.routes[0];
  const coords = r.geometry.coordinates; // [lon,lat]
  const route = coords.map(([lon,lat]) => ({ lat, lng: lon }));
  const distanceKm = r.distance / 1000;
  const durationSec = r.duration;
  return { route, distanceKm, durationSec };
}
