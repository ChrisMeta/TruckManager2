export function consumptionPer100Km(truck){
  const base = {
    van: { diesel: 9, gasoline: 11, electric: 22 },
    box: { diesel: 18, gasoline: 22, electric: 65 },
    rigid: { diesel: 28, gasoline: 32, electric: 110 },
    semi: { diesel: 33, gasoline: 37, electric: 140 }
  };
  const t = base[truck.category] || base.van;
  return (t[truck.fuelType] ?? 12) * (1 + (truck.wear||0) * 0.2);
}
export function tickEnergyUse(truck, distanceKm){
  const per100 = consumptionPer100Km(truck);
  return per100 * (distanceKm/100);
}
export function refill(truck){
  if (truck.fuelType === 'electric') {
    truck.currentEnergy = truck.batteryKwh || 0;
  } else {
    truck.currentEnergy = truck.fuelCapacityL || 0;
  }
  return truck.currentEnergy;
}
export function energyCapacity(truck){
  return truck.fuelType === 'electric' ? (truck.batteryKwh||0) : (truck.fuelCapacityL||0);
}
