# Frontend for Node Backend

This React + Leaflet SPA talks to the Node/Express backend you downloaded.

## Configure
- Copy `.env.example` to `.env` and set `VITE_API_BASE` if your API is not `http://localhost:4000`.

## Run
```bash
npm install
npm run dev
```

## What changed vs. Atlas App Services build
- Removed realm-web usage; now uses `axios` to call your REST API (`/api/...`) and `socket.io-client` for live updates.
- Login/Register call `/api/auth/*` which sets an HttpOnly JWT cookie.
- Map interactions and panels call the matching routes you already have in the backend.
