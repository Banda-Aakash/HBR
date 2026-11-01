import {getUserId, getQueryParam, getParam, requireAuth} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const category = getQueryParam(req, 'category');
  const userId = getUserId(req);

  const where: any = {};
  if (category && category !== 'all') { where.category = category; }

  const interiors = await prisma.interior.findMany({where});

  // Check which ones the user liked
  let likedIds = new Set<string>();
  if (userId) {
    const likes = await prisma.interiorLike.findMany({where: {userId}, select: {interiorId: true}});
    likedIds = new Set(likes.map(l => l.interiorId));
  }

  const result = interiors.map(i => ({...i, isLiked: likedIds.has(i.id)}));
  res.json({count: result.length, interiors: result});
});

router.get('/:id', async (req: Request, res: Response) => {
  const interior = await prisma.interior.findUnique({where: {id: getParam(req, 'id')}});
  if (!interior) { res.status(404).json({error: 'Design not found'}); return; }
  res.json(interior);
});

router.post('/:id/like', requireAuth, async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const interior = await prisma.interior.findUnique({where: {id: getParam(req, 'id')}});
  if (!interior) { res.status(404).json({error: 'Design not found'}); return; }

  const existing = await prisma.interiorLike.findUnique({
    where: {userId_interiorId: {userId, interiorId: getParam(req, 'id')}},
  });

  if (existing) {
    await prisma.interiorLike.delete({where: {id: existing.id}});
    const updated = await prisma.interior.update({
      where: {id: getParam(req, 'id')},
      data: {likes: {decrement: 1}},
    });
    res.json({...updated, isLiked: false});
  } else {
    await prisma.interiorLike.create({data: {userId, interiorId: getParam(req, 'id')}});
    const updated = await prisma.interior.update({
      where: {id: getParam(req, 'id')},
      data: {likes: {increment: 1}},
    });
    res.json({...updated, isLiked: true});
  }
});

export default router;
