import express, {NextFunction, Request, Response} from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import {attachUser} from './helpers';
import authRoutes from './routes/auth';
import propertiesRoutes from './routes/properties';
import bookingsRoutes from './routes/bookings';
import favoritesRoutes from './routes/favorites';
import interiorsRoutes from './routes/interiors';
import rentalsRoutes from './routes/rentals';

const app = express();

// Number of proxies in front of the app, so rate limits see the real client IP
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS) || 0);

// ── Middleware ──
app.use(helmet());
// The mobile app doesn't use CORS, only browser clients listed here can call the API
app.use(cors({origin: process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || false}));
app.use(rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT) || 300,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {error: 'Too many requests. Please slow down.'},
}));
app.use(express.json({limit: '100kb'}));
app.use((req, _res, next) => {
  req.body ??= {};
  next();
});
app.use(attachUser);

// Request logger
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
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
  res.json({status: 'ok', timestamp: new Date().toISOString()});
});

// ── 404 handler ──
app.use((_req, res) => {
  res.status(404).json({error: 'Not found'});
});

// ── Error handler ──
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) { console.error(err); }
  res.status(status).json({error: status === 500 ? 'Something went wrong' : 'Invalid request'});
});

export default app;
