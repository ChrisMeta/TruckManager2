# Truck Manager Backend (Localhost API)

Express + MongoDB (Atlas) backend for the trucking simulator.
- Auth: Passport local (email/username + password) + JWT in HttpOnly cookie
- Realtime: Socket.IO broadcasts truck & assignment updates
- Game logic: server-side tick loop moves trucks, consumes fuel/energy, refuels at stations, handles wear/maintenance

## Quick start
```bash
cd backend
cp .env.example .env   # already filled with your Atlas URI; rotate for safety
npm install
npm run dev            # or: npm start
```
API on **http://localhost:4000**

### Environment
`PORT=4000`
`CLIENT_ORIGIN=http://localhost:5173`
`MONGODB_URI=<your Atlas URI>`
`JWT_SECRET=<random>`

## API (high level)
- POST `/api/auth/register` {username,email,password}
- POST `/api/auth/login` {usernameOrEmail,password}` → sets HttpOnly cookie
- POST `/api/auth/logout`
- GET  `/api/auth/me`

- GET  `/api/catalog`                          → list available trucks to buy
- GET  `/api/trucks`                           → list my trucks
- POST `/api/trucks/buy`                       → buy a truck from catalog (send the chosen fields)
- PATCH `/api/trucks/:id`                      → upgrade/update
- DELETE `/api/trucks/:id`

- GET  `/api/contracts`                        → list contracts
- POST `/api/contracts/generate`               → make a new contract
- POST `/api/contracts/:contractId/assign`     → assign a truck

- GET  `/api/contracts/assignments`            → list assignments
- POST `/api/stations/hq`                      → set HQ (click on map)
- GET  `/api/stations`                         → list stations
- POST `/api/stations`                         → create station (fuel/charge/service)
- GET  `/api/game/state`                       → combined state for UI

Socket.IO events:
- `truck:update` {truckId, location, currentEnergy, wear, status}
- `assignment:update` {assignmentId, progress, status}
