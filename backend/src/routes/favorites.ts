import {cleanString, getUserId, requireAuth} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';
import {formatProperty, LISTED_STATUS} from './properties';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const favs = await prisma.favorite.findMany({
    where: {userId: getUserId(req), property: {status: LISTED_STATUS}},
    include: {property: true},
    orderBy: {createdAt: 'desc'},
  });

  const favIds = favs.map(f => f.propertyId);
  const properties = favs.map(f => formatProperty(f.property, favIds));

  res.json({count: properties.length, favorites: favIds, properties});
});

router.post('/toggle', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const propertyId = cleanString(req.body.propertyId, 50);
  if (!propertyId) { res.status(400).json({error: 'propertyId required'}); return; }

  const property = await prisma.property.findUnique({where: {id: propertyId}});
  if (!property) { res.status(404).json({error: 'Property not found'}); return; }

  const existing = await prisma.favorite.findUnique({
    where: {userId_propertyId: {userId, propertyId}},
  });

  // deleteMany and skipDuplicates let a repeat tap finish without an error
  if (existing) {
    await prisma.favorite.deleteMany({where: {userId, propertyId}});
    res.json({propertyId, isFavorite: false});
  } else {
    await prisma.favorite.createMany({data: [{userId, propertyId}], skipDuplicates: true});
    res.json({propertyId, isFavorite: true});
  }
});

export default router;
