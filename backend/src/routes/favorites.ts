import {getUserId, getQueryParam} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({error: 'Not authenticated'}); return; }

  const favs = await prisma.favorite.findMany({
    where: {userId},
    include: {property: true},
  });

  const favIds = favs.map(f => f.propertyId);
  const properties = favs.map(f => ({...f.property, isFavorite: true}));

  res.json({count: properties.length, favorites: favIds, properties});
});

router.post('/toggle', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({error: 'Not authenticated'}); return; }

  const {propertyId} = req.body;
  if (!propertyId) { res.status(400).json({error: 'propertyId required'}); return; }

  const existing = await prisma.favorite.findUnique({
    where: {userId_propertyId: {userId, propertyId}},
  });

  if (existing) {
    await prisma.favorite.delete({where: {id: existing.id}});
    res.json({propertyId, isFavorite: false});
  } else {
    await prisma.favorite.create({data: {userId, propertyId}});
    res.json({propertyId, isFavorite: true});
  }
});

export default router;
