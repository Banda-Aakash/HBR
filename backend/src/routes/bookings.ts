import {cleanString, getUserId, getQueryParam, getParam, requireAuth} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

router.use(requireAuth);

router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const mode = getQueryParam(req, "mode");
  const where: any = {userId};
  if (mode) { where.mode = mode; }

  const bookings = await prisma.booking.findMany({
    where,
    include: {property: {select: {id: true, title: true, city: true, images: true}}},
    orderBy: {createdAt: 'desc'},
  });

  const enriched = bookings.map(b => ({
    ...b,
    property: b.property ? {id: b.property.id, title: b.property.title, city: b.property.city, image: b.property.images?.[0]} : null,
  }));

  res.json({count: enriched.length, bookings: enriched});
});

router.post('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);

  const propertyId = cleanString(req.body.propertyId, 50);
  const date = cleanString(req.body.date, 32);
  const time = cleanString(req.body.time, 32);
  const notes = cleanString(req.body.notes, 1000);
  const mode = req.body.mode === 'tenant' ? 'tenant' : 'owner';
  if (!propertyId || !date || !time) { res.status(400).json({error: 'propertyId, date, time required'}); return; }

  const property = await prisma.property.findUnique({where: {id: propertyId}});
  if (!property) { res.status(404).json({error: 'Property not found'}); return; }

  const booking = await prisma.booking.create({
    data: {userId, propertyId, date, time, notes: notes || '', mode, status: 'confirmed'},
  });

  res.status(201).json({
    booking,
    property: {id: property.id, title: property.title, city: property.city, image: property.images?.[0]},
  });
});

router.patch('/:id/cancel', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const booking = await prisma.booking.findFirst({where: {id: getParam(req, 'id'), userId}});
  if (!booking) { res.status(404).json({error: 'Booking not found'}); return; }

  const updated = await prisma.booking.update({where: {id: getParam(req, 'id')}, data: {status: 'cancelled'}});
  res.json(updated);
});

export default router;
