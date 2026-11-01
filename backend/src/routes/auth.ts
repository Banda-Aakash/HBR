import {getUserId, getQueryParam} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const {email, password} = req.body;
  if (!email || !password) { res.status(400).json({error: 'Email and password required'}); return; }

  const user = await prisma.user.findFirst({
    where: {email: {equals: email, mode: 'insensitive'}, password},
  });
  if (!user) { res.status(401).json({error: 'Invalid credentials'}); return; }

  const {password: _, ...safe} = user;
  res.json({token: `mock-token-${user.id}`, user: safe});
});

router.post('/register', async (req: Request, res: Response) => {
  const {name, email, password, phone} = req.body;
  if (!name || !email || !password) { res.status(400).json({error: 'Name, email, password required'}); return; }

  const exists = await prisma.user.findFirst({where: {email: {equals: email, mode: 'insensitive'}}});
  if (exists) { res.status(409).json({error: 'Email already registered'}); return; }

  const user = await prisma.user.create({
    data: {
      name, email, password,
      phone: phone || '',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0F172A&color=fff`,
      roles: ['buyer'],
    },
  });

  const {password: _, ...safe} = user;
  res.status(201).json({token: `mock-token-${user.id}`, user: safe});
});

router.get('/me', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({error: 'Not authenticated'}); return; }

  const user = await prisma.user.findUnique({where: {id: userId}});
  if (!user) { res.status(404).json({error: 'User not found'}); return; }

  const {password: _, ...safe} = user;
  res.json({user: safe});
});

export default router;
