import { haversineKm, interpolateRoute } from '../utils/distance.js';
export function planRoute(origin, destination){
  const distanceKm = haversineKm(origin, destination);
  const route = interpolateRoute(origin, destination, Math.max(100, Math.floor(distanceKm*4)));
  return { route, distanceKm };
}
