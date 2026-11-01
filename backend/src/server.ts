import 'dotenv/config';
import {getJwtSecret} from './helpers';
import app from './app';

const PORT = Number(process.env.PORT) || 3001;

// Fail at startup rather than on the first login
getJwtSecret();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`RealApp API running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/api/health`);
});
