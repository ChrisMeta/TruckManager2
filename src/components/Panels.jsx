import React from 'react';
import Fleet from './panels/Fleet';
import Contracts from './panels/Contracts';
import Stations from './panels/Stations';
import Dashboard from './panels/Dashboard';

export default function Panels({ state, actions, onRefresh }){
  return (
    <div className="space-y-3">
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="h">Dashboard</h2>
          <div className="flex gap-2">
            <button className="btn" onClick={onRefresh}>Refresh</button>
            <button className="btn" onClick={actions.logout}>Logout</button>
          </div>
        </div>
        <Dashboard state={state} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="h">Fleet</h2>
          <button className="btn btn-primary" onClick={actions.buyDefault}>Buy default</button>
        </div>
        <Fleet state={state} onAssign={actions.assignFirst} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="h">Contracts</h2>
          <button className="btn" onClick={actions.generateContract}>Generate</button>
        </div>
        <Contracts state={state} />
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <h2 className="h">Stations</h2>
          <button className="btn" onClick={() => actions.createStation({type:'fuel', name:'Fuel Stop', location:{lat:52.48,lng:13.4}, radiusKm:1})}>Add Fuel near Berlin</button>
        </div>
        <Stations state={state} />
      </div>
    </div>
  );
}
