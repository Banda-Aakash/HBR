import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth';
import propertiesRoutes from './routes/properties';
import bookingsRoutes from './routes/bookings';
import favoritesRoutes from './routes/favorites';
import interiorsRoutes from './routes/interiors';
import rentalsRoutes from './routes/rentals';

const app = express();
const PORT = 3001;

// ── Middleware ──
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ── Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/interiors', interiorsRoutes);
app.use('/api/rentals', rentalsRoutes);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ── Start ──
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 RealApp API running on http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
  console.log(`\n   Routes:`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   POST   /api/auth/register`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   GET    /api/properties?type=&city=&search=&featured=`);
  console.log(`   GET    /api/properties/:id`);
  console.log(`   GET    /api/bookings`);
  console.log(`   POST   /api/bookings`);
  console.log(`   PATCH  /api/bookings/:id/cancel`);
  console.log(`   GET    /api/favorites`);
  console.log(`   POST   /api/favorites/toggle`);
  console.log(`   GET    /api/interiors?category=`);
  console.log(`   GET    /api/interiors/:id`);
  console.log(`   POST   /api/interiors/:id/like`);
  console.log(`   GET    /api/rentals?state=`);
  console.log(`   GET    /api/rentals/:id`);
  console.log(`   POST   /api/rentals/:id/transition`);
  console.log(`   POST   /api/rentals/:id/documents`);
  console.log(`   PATCH  /api/rentals/:id`);
  console.log('');
});
