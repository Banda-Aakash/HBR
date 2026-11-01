import 'dotenv/config';
import {getJwtSecret} from './helpers';
import app from './app';
import prisma from './prisma';

const PORT = Number(process.env.PORT) || 3001;
const SHUTDOWN_TIMEOUT_MS = 10000;

// Fail at startup rather than on the first login
getJwtSecret();

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`RealApp API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});

// Let requests in progress finish when the host restarts or redeploys the app
function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  setTimeout(() => process.exit(1), SHUTDOWN_TIMEOUT_MS).unref();
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.once('SIGTERM', shutdown);
process.once('SIGINT', shutdown);
