import {cleanString, getUserId, getQueryParam, getParam, isUniqueViolation, requireAuth} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';
import {LISTED_STATUS} from './properties';

const router = Router();

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^(1[0-2]|[1-9]):[0-5]\d (AM|PM)$/;

/** A real calendar date in YYYY-MM-DD form that isn't in the past */
function isBookableDate(date: string): boolean {
  if (!DATE_PATTERN.test(date)) { return false; }
  const parsed = new Date(`${date}T00:00:00Z`);
  // Impossible dates such as 2026-02-31 roll over into a different date
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) { return false; }
  return date >= new Date().toISOString().slice(0, 10);
}

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
  if (!isBookableDate(date)) { res.status(400).json({error: 'Choose a valid date that is not in the past'}); return; }
  if (!TIME_PATTERN.test(time)) { res.status(400).json({error: 'Choose a valid time'}); return; }

  const property = await prisma.property.findFirst({where: {id: propertyId, status: LISTED_STATUS}});
  if (!property) { res.status(404).json({error: 'Property not found'}); return; }

  try {
    // Stays pending until someone at the business confirms the visit
    const booking = await prisma.booking.create({
      data: {userId, propertyId, date, time, notes: notes || '', mode},
    });

    res.status(201).json({
      booking,
      property: {id: property.id, title: property.title, city: property.city, image: property.images?.[0]},
    });
  } catch (e) {
    if (!isUniqueViolation(e)) { throw e; }
    res.status(409).json({error: 'You already have a visit booked for this time'});
  }
});

router.patch('/:id/cancel', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const booking = await prisma.booking.findFirst({where: {id: getParam(req, 'id'), userId}});
  if (!booking) { res.status(404).json({error: 'Booking not found'}); return; }

  const updated = await prisma.booking.update({where: {id: getParam(req, 'id')}, data: {status: 'cancelled'}});
  res.json(updated);
});

export default router;
