import {cleanString, getUserId, requireAuth, signToken} from '../helpers';
import {Router, Request, Response} from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import prisma from '../prisma';

const router = Router();

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_BYTES = 72; // bcrypt ignores anything beyond this
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Compared against when the email is unknown, so both cases take the same time
const DUMMY_HASH = bcrypt.hashSync('no-such-account', BCRYPT_ROUNDS);

// Failed attempts only, so normal use never hits the limit
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {error: 'Too many attempts. Please try again later.'},
});

function publicUser<T extends {password: string}>(user: T) {
  const {password: _, ...safe} = user;
  return safe;
}

async function checkPassword(user: {id: string; password: string}, password: string): Promise<boolean> {
  if (user.password.startsWith('$2')) { return bcrypt.compare(password, user.password); }

  // Accounts from before hashing: verify once, then store a hash instead
  if (user.password !== password) { return false; }
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  await prisma.user.update({where: {id: user.id}, data: {password: hash}});
  return true;
}

router.post('/login', authLimiter, async (req: Request, res: Response) => {
  const email = cleanString(req.body.email, 254);
  const {password} = req.body;
  if (!email || typeof password !== 'string' || !password) {
    res.status(400).json({error: 'Email and password required'});
    return;
  }

  const user = await prisma.user.findFirst({where: {email: {equals: email, mode: 'insensitive'}}});
  if (!user) {
    await bcrypt.compare(password, DUMMY_HASH);
    res.status(401).json({error: 'Invalid credentials'});
    return;
  }
  if (!(await checkPassword(user, password))) {
    res.status(401).json({error: 'Invalid credentials'});
    return;
  }

  res.json({token: signToken(user.id), user: publicUser(user)});
});

router.post('/register', authLimiter, async (req: Request, res: Response) => {
  const name = cleanString(req.body.name, 100);
  const email = cleanString(req.body.email, 254)?.toLowerCase();
  const phone = cleanString(req.body.phone, 20);
  const {password} = req.body;
  if (!name || !email || typeof password !== 'string') {
    res.status(400).json({error: 'Name, email, password required'});
    return;
  }
  if (!EMAIL_PATTERN.test(email)) { res.status(400).json({error: 'Enter a valid email address'}); return; }
  if (password.length < MIN_PASSWORD_LENGTH) {
    res.status(400).json({error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`});
    return;
  }
  if (Buffer.byteLength(password) > MAX_PASSWORD_BYTES) {
    res.status(400).json({error: `Password must be at most ${MAX_PASSWORD_BYTES} characters`});
    return;
  }

  const exists = await prisma.user.findFirst({where: {email: {equals: email, mode: 'insensitive'}}});
  if (exists) { res.status(409).json({error: 'Email already registered'}); return; }

  const user = await prisma.user.create({
    data: {
      name, email,
      password: await bcrypt.hash(password, BCRYPT_ROUNDS),
      phone: phone || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff`,
      roles: ['buyer'],
    },
  });

  res.status(201).json({token: signToken(user.id), user: publicUser(user)});
});

router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({where: {id: getUserId(req)}});
  if (!user) { res.status(404).json({error: 'User not found'}); return; }

  res.json({user: publicUser(user)});
});

// Permanently removes the account and everything it owns
router.delete('/me', authLimiter, requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const {password} = req.body;
  if (typeof password !== 'string' || !password) { res.status(400).json({error: 'Password required'}); return; }

  const user = await prisma.user.findUnique({where: {id: userId}});
  if (!user) { res.status(404).json({error: 'User not found'}); return; }
  // 403, not 401: the session is still valid, so the app must not log out
  if (!(await checkPassword(user, password))) { res.status(403).json({error: 'Incorrect password'}); return; }

  const rentals = await prisma.rental.findMany({where: {userId}, select: {id: true}});
  const rentalIds = rentals.map(r => r.id);
  const likes = await prisma.interiorLike.findMany({where: {userId}, select: {interiorId: true}});

  await prisma.$transaction([
    prisma.rentalInspectionItem.deleteMany({where: {inspection: {rentalId: {in: rentalIds}}}}),
    prisma.rentalInspection.deleteMany({where: {rentalId: {in: rentalIds}}}),
    prisma.rentalDocument.deleteMany({where: {rentalId: {in: rentalIds}}}),
    prisma.ledgerEntry.deleteMany({where: {rentalId: {in: rentalIds}}}),
    prisma.rental.deleteMany({where: {userId}}),
    prisma.booking.deleteMany({where: {userId}}),
    prisma.favorite.deleteMany({where: {userId}}),
    prisma.interiorLike.deleteMany({where: {userId}}),
    prisma.interior.updateMany({
      where: {id: {in: likes.map(l => l.interiorId)}},
      data: {likes: {decrement: 1}},
    }),
    prisma.user.delete({where: {id: userId}}),
  ]);

  res.status(204).end();
});

export default router;
