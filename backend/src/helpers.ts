import {NextFunction, Request, Response} from 'express';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const TOKEN_LIFETIME = '30d';
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_PAGE = 100000;

/**
 * Proxies in front of the app. Production must state this, because a proxy that
 * isn't counted puts every user behind one IP and one shared rate limit.
 */
export function getTrustProxyHops(): number {
  const value = process.env.TRUST_PROXY_HOPS?.trim();
  if (!value && process.env.NODE_ENV === 'production') {
    throw new Error('TRUST_PROXY_HOPS must be set in production, use 0 if nothing sits in front of the app');
  }

  const hops = Number(value || 0);
  if (!Number.isInteger(hops) || hops < 0) { throw new Error('TRUST_PROXY_HOPS must be a whole number'); }
  return hops;
}

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

/** Also checks the account still exists, because tokens outlive deleted accounts */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = req.userId && await prisma.user.findUnique({where: {id: req.userId}, select: {id: true}});
  if (!user) { res.status(401).json({error: 'Not authenticated'}); return; }
  next();
}

/** Reads the role from the database, so removing it takes effect immediately */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = req.userId && await prisma.user.findUnique({where: {id: req.userId}, select: {roles: true}});
  if (!user) { res.status(401).json({error: 'Not authenticated'}); return; }
  if (!user.roles.includes('admin')) { res.status(403).json({error: 'Admin access required'}); return; }
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

/** Page position from ?page= and ?limit=, with bad values falling back to the defaults */
export function getPaging(req: Request) {
  const page = Math.min(Math.trunc(cleanNumber(getQueryParam(req, 'page'), 1) ?? 1), MAX_PAGE);
  const limit = Math.min(Math.trunc(cleanNumber(getQueryParam(req, 'limit'), 1) ?? DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  return {page, limit, skip: (page - 1) * limit};
}

/** True when a database write broke a unique rule, such as a duplicate row */
export function isUniqueViolation(error: unknown): boolean {
  return (error as {code?: string} | null)?.code === 'P2002';
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
