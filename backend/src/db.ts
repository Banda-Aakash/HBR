import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, 'data', 'db.json');

export interface DbSchema {
  users: any[];
  properties: any[];
  bookings: any[];
  favorites: Record<string, string[]>;
  interiors: any[];
  rentals: any[];
}

/** Read the entire database */
export function readDb(): DbSchema {
  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(raw);
}

/** Write the entire database (atomic write via temp file) */
export function writeDb(data: DbSchema): void {
  const tmp = DB_PATH + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmp, DB_PATH);
}

/** Read → mutate → write helper */
export function updateDb(mutator: (db: DbSchema) => void): DbSchema {
  const db = readDb();
  mutator(db);
  writeDb(db);
  return db;
}
