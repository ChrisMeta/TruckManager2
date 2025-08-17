import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import { Server } from 'socket.io';

import passport from 'passport';
import authRouter from './routes/auth.js';
import catalogRouter from './routes/catalog.js';
import trucksRouter from './routes/trucks.js';
import contractsRouter from './routes/contracts.js';
import stationsRouter from './routes/stations.js';
import gameRouter from './routes/game.js';
import premiumRouter from './routes/premium.js';
import assignmentsRouter from './routes/assignments.js';
import { startGameLoop } from './services/gameLoop.js';

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const PORT = process.env.PORT || 4000;
const DB_URI = process.env.DB_URI;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: FRONTEND_ORIGIN, methods: ['GET','POST','PATCH','DELETE'], credentials: true }
});

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use(passport.initialize());

app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/trucks', trucksRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/stations', stationsRouter);
app.use('/api/game', gameRouter);
app.use('/api/premium', premiumRouter);
app.use('/api/assignments', assignmentsRouter);

app.get('/api/health', (req,res)=>res.json({ ok:true }));

async function start() {
  if (!DB_URI) {
    console.error('[Mongo] DB_URI is not set. Put it in backend/.env');
    process.exit(1);
  }
  try {
    await mongoose.connect(DB_URI, { serverSelectionTimeoutMS: 12000 });
    console.log('[Mongo] connected to', mongoose.connection.host);
  } catch (err) {
    console.error('[Mongo] connection error:', err?.message || err);
    process.exit(1);
  }

  server.listen(PORT, () => {
    console.log(`[Server] http://localhost:${PORT} (CORS: ${FRONTEND_ORIGIN})`);
  });

  startGameLoop(io);
}

start();
