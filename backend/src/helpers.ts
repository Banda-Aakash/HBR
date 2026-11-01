import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const TOKEN_LIFETIME = '30d';

/** Read the signing secret, refusing to run with a missing or weak one */
export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return secret;
}

export function signToken(userId: string): string {
  return jwt.sign({}, getJwtSecret(), {
    subject: userId,
    expiresIn: TOKEN_LIFETIME,
    algorithm: 'HS256',
  });
}

/** Set req.userId from a valid bearer token. Invalid tokens leave it unset. */
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), getJwtSecret(), {algorithms: ['HS256']});
      if (typeof payload !== 'string' && payload.sub) { req.userId = payload.sub; }
    } catch {
      // Expired or forged tokens are treated as logged out
    }
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) { res.status(401).json({error: 'Not authenticated'}); return; }
  next();
}

/** Get the verified user ID, always returns string or empty */
export function getUserId(req: Request): string {
  return req.userId || '';
}

/** Get a single query param as string or undefined */
export function getQueryParam(req: Request, key: string): string | undefined {
  const val = req.query[key];
  return typeof val === 'string' ? val : undefined;
}

/** Get route param as string */
export function getParam(req: Request, key: string): string {
  const val = req.params[key];
  return typeof val === 'string' ? val : String(val);
}

/** Trimmed non-empty string within maxLength, otherwise undefined */
export function cleanString(value: unknown, maxLength = 200): string | undefined {
  if (typeof value !== 'string') { return undefined; }
  const trimmed = value.trim();
  return trimmed && trimmed.length <= maxLength ? trimmed : undefined;
}

/** Finite number at or above min, otherwise undefined */
export function cleanNumber(value: unknown, min = 0): number | undefined {
  const num = typeof value === 'string' && value.trim() ? Number(value) : value;
  return typeof num === 'number' && Number.isFinite(num) && num >= min ? num : undefined;
}
