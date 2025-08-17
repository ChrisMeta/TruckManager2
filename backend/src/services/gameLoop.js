import Assignment from '../models/Assignment.js';
import Truck from '../models/Truck.js';
import Contract from '../models/Contract.js';
import Profile from '../models/Profile.js';
import { tickEnergyUse, energyCapacity, refill } from './fuel.js';
import mongoose from 'mongoose';

const TICK_MS = 1000;
const LOW_ENERGY_THRESHOLD = 0.1;
const REFUEL_TIME_MS = 5 * 60 * 1000; // 5 minutes

export function startGameLoop(io){
  console.log('[GameLoop] Starting...');
  setInterval(async () => {
    try {
      // Add connection check
      if (mongoose.connection.readyState !== 1) {
        console.log('[GameLoop] MongoDB not connected, state:', mongoose.connection.readyState);
        return;
      }
      
      const now = new Date();
      const assignments = await Assignment.find({ status: 'in_progress' });
      for (const a of assignments){
        const truck = await Truck.findById(a.truckId);
        if (!truck) continue;
        const contract = await Contract.findById(a.contractId);
        if (!contract) continue;

        // Handle refuel pause
        if (truck.refuelUntil && now < new Date(truck.refuelUntil)) {
          io.emit('truck:update', { truckId: String(truck._id), location: truck.location, currentEnergy: truck.currentEnergy, wear: truck.wear, status: 'refueling' });
          continue;
        } else if (truck.refuelUntil && now >= new Date(truck.refuelUntil)) {
          refill(truck);
          truck.refuelUntil = null;
          truck.status = 'enroute';
          await truck.save();
        }

        const lastTick = a.lastTickAt ? new Date(a.lastTickAt) : now;
        const dtSec = Math.max(1, (now - lastTick)/1000);
        const speedKps = (truck.speedKph || 60) / 3600.0;
        const distanceThisTickKm = speedKps * dtSec;

        const totalDist = Math.max(contract.distanceKm || 1e-6, 1e-6);
        const nextProgress = Math.min(1, a.progress + distanceThisTickKm / totalDist);

        const nextIdx = Math.floor(nextProgress * (a.route.length - 1));
        const loc = a.route[Math.min(nextIdx, a.route.length-1)];
        truck.location = { lat: loc.lat, lng: loc.lng };

        const used = tickEnergyUse(truck, distanceThisTickKm);
        truck.currentEnergy = Math.max(0, (truck.currentEnergy || 0) - used);
        truck.odometerKm = (truck.odometerKm || 0) + distanceThisTickKm;
        truck.wear = Math.min(1, (truck.wear || 0) + distanceThisTickKm / (truck.maintenanceDueKm || 20000) * 0.05);

        if (truck.currentEnergy <= energyCapacity(truck) * LOW_ENERGY_THRESHOLD) {
          truck.status = 'refueling';
          truck.refuelUntil = new Date(now.getTime() + REFUEL_TIME_MS);
          await truck.save();
          io.emit('truck:update', { truckId: String(truck._id), location: truck.location, currentEnergy: truck.currentEnergy, wear: truck.wear, status: truck.status });
          continue;
        }

        a.progress = nextProgress;
        a.lastTickAt = now;
        if (a.progress >= 1){
          a.status = 'completed';
          truck.status = 'idle';
          truck.assignedAssignmentId = null;
          const success = now <= new Date(contract.deadline);
          contract.status = success ? 'completed' : 'failed';
          // Don't auto-credit payout; use collect endpoint
          await contract.save();
        }

        await truck.save();
        await a.save();

        io.emit('truck:update', { truckId: String(truck._id), location: truck.location, currentEnergy: truck.currentEnergy, wear: truck.wear, status: truck.status });
        io.emit('assignment:update', { assignmentId: String(a._id), progress: a.progress, status: a.status });
      }
    } catch (err) {
      console.error('[GameLoop] Error:', err.message);
    }
  }, TICK_MS);
}