import {Request} from 'express';

/** Get user ID from x-user-id header, always returns string or empty */
export function getUserId(req: Request): string {
  const val = req.headers['x-user-id'];
  return typeof val === 'string' ? val : '';
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
