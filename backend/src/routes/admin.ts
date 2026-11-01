import {cleanNumber, cleanString, getPaging, getParam, getQueryParam, requireAdmin} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

const PROPERTY_TYPES = ['apartment', 'house', 'villa', 'condo', 'penthouse'];
const PROPERTY_STATUSES = ['available', 'booked', 'sold', 'hidden'];
const PRICE_UNITS = ['total', 'month'];
const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'];
const MAX_ROOMS = 1000;
const MAX_IMAGES = 10;
const MAX_AMENITIES = 30;
const EARLIEST_YEAR = 1800;

function cleanInt(value: unknown, min: number, max: number): number | undefined {
  const num = cleanNumber(value, min);
  return num !== undefined && Number.isInteger(num) && num <= max ? num : undefined;
}

function isHttpsUrl(value: unknown): boolean {
  if (typeof value !== 'string' || value.length > 2000) { return false; }
  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

/** Checks a submitted listing, returning the fields to save or what needs fixing */
function parseProperty(body: any) {
  const title = cleanString(body.title, 150);
  const description = cleanString(body.description, 5000);
  const address = cleanString(body.address);
  const city = cleanString(body.city, 100);
  const state = cleanString(body.state, 100);
  const price = cleanNumber(body.price, 1);
  const area = cleanNumber(body.area, 1);
  const bedrooms = cleanInt(body.bedrooms, 0, MAX_ROOMS);
  const bathrooms = cleanInt(body.bathrooms, 0, MAX_ROOMS);
  const parkingSpaces = cleanInt(body.parkingSpaces ?? 0, 0, MAX_ROOMS);
  const yearBuilt = cleanInt(body.yearBuilt, EARLIEST_YEAR, new Date().getFullYear() + 10);
  const images = Array.isArray(body.images) ? body.images : [];
  const amenities = (Array.isArray(body.amenities) ? body.amenities : []).map((a: unknown) => cleanString(a, 60));

  if (!title) { return {error: 'Enter a title'}; }
  if (!description) { return {error: 'Enter a description'}; }
  if (!address) { return {error: 'Enter an address'}; }
  if (!city) { return {error: 'Enter a city'}; }
  if (!state) { return {error: 'Enter a state'}; }
  if (price === undefined) { return {error: 'Enter a price above 0'}; }
  if (area === undefined) { return {error: 'Enter the area above 0'}; }
  if (bedrooms === undefined) { return {error: 'Enter the number of bedrooms'}; }
  if (bathrooms === undefined) { return {error: 'Enter the number of bathrooms'}; }
  if (parkingSpaces === undefined) { return {error: 'Enter the number of parking spaces'}; }
  if (yearBuilt === undefined) { return {error: 'Enter a valid year built'}; }
  if (!PROPERTY_TYPES.includes(body.type)) { return {error: 'Choose a property type'}; }
  if (!PROPERTY_STATUSES.includes(body.status)) { return {error: 'Choose a status'}; }
  if (!PRICE_UNITS.includes(body.priceUnit)) { return {error: 'Choose whether the price is total or monthly'}; }
  if (images.length === 0 || images.length > MAX_IMAGES) { return {error: `Add between 1 and ${MAX_IMAGES} photo links`}; }
  if (!images.every(isHttpsUrl)) { return {error: 'Photo links must start with https://'}; }
  if (amenities.length > MAX_AMENITIES || amenities.some((a: string | undefined) => !a)) {
    return {error: `Keep to ${MAX_AMENITIES} amenities of up to 60 characters each`};
  }

  return {
    data: {
      title, description, address, city, state, price, area, bedrooms, bathrooms, parkingSpaces, yearBuilt,
      images, amenities: amenities as string[],
      type: body.type as string,
      status: body.status as string,
      priceUnit: body.priceUnit as string,
      zipCode: cleanString(body.zipCode, 20) || '',
      isFeatured: body.isFeatured === true,
      agentName: cleanString(body.agentName, 100) || '',
      agentPhone: cleanString(body.agentPhone, 20) || '',
      agentEmail: cleanString(body.agentEmail, 254) || '',
    },
  };
}

router.use(requireAdmin);

// GET /api/admin/summary — counts for the page header
router.get('/summary', async (_req: Request, res: Response) => {
  const [pendingBookings, listings] = await Promise.all([
    prisma.booking.count({where: {status: 'pending'}}),
    prisma.property.count(),
  ]);
  res.json({pendingBookings, listings});
});

// GET /api/admin/bookings — visit requests, next visit first
router.get('/bookings', async (req: Request, res: Response) => {
  const status = getQueryParam(req, 'status') || 'pending';
  const {page, limit, skip} = getPaging(req);
  const where = BOOKING_STATUSES.includes(status) ? {status} : {};

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        user: {select: {name: true, email: true, phone: true}},
        property: {select: {id: true, title: true, city: true}},
      },
      orderBy: [{date: 'asc'}, {createdAt: 'asc'}],
      skip,
      take: limit,
    }),
    prisma.booking.count({where}),
  ]);

  res.json({count: bookings.length, total, page, limit, hasMore: skip + bookings.length < total, bookings});
});

// PATCH /api/admin/bookings/:id — confirm or cancel a visit
router.patch('/bookings/:id', async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const {status} = req.body;
  if (status !== 'confirmed' && status !== 'cancelled') {
    res.status(400).json({error: 'status must be confirmed or cancelled'});
    return;
  }

  // A cancelled visit stays cancelled, its slot may already have been rebooked
  const {count} = await prisma.booking.updateMany({where: {id, status: {not: 'cancelled'}}, data: {status}});
  const booking = await prisma.booking.findUnique({where: {id}});
  if (!booking) { res.status(404).json({error: 'Booking not found'}); return; }
  if (count === 0) { res.status(409).json({error: 'This visit was already cancelled'}); return; }

  res.json(booking);
});

// GET /api/admin/properties — every listing, including ones hidden from the app
router.get('/properties', async (req: Request, res: Response) => {
  const search = getQueryParam(req, 'search');
  const {page, limit, skip} = getPaging(req);

  const where: any = {};
  if (search) {
    where.OR = [
      {title: {contains: search, mode: 'insensitive'}},
      {city: {contains: search, mode: 'insensitive'}},
      {address: {contains: search, mode: 'insensitive'}},
    ];
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({where, orderBy: [{createdAt: 'desc'}, {id: 'asc'}], skip, take: limit}),
    prisma.property.count({where}),
  ]);

  res.json({count: properties.length, total, page, limit, hasMore: skip + properties.length < total, properties});
});

// POST /api/admin/properties
router.post('/properties', async (req: Request, res: Response) => {
  const {data, error} = parseProperty(req.body);
  if (!data) { res.status(400).json({error}); return; }

  res.status(201).json(await prisma.property.create({data}));
});

// PUT /api/admin/properties/:id
router.put('/properties/:id', async (req: Request, res: Response) => {
  const id = getParam(req, 'id');
  const {data, error} = parseProperty(req.body);
  if (!data) { res.status(400).json({error}); return; }

  const {count} = await prisma.property.updateMany({where: {id}, data});
  if (count === 0) { res.status(404).json({error: 'Listing not found'}); return; }

  res.json(await prisma.property.findUnique({where: {id}}));
});

// DELETE /api/admin/properties/:id — for mistakes, real listings get hidden instead
router.delete('/properties/:id', async (req: Request, res: Response) => {
  const id = getParam(req, 'id');

  const visits = await prisma.booking.count({where: {propertyId: id}});
  if (visits > 0) {
    res.status(409).json({error: 'This listing has visit history, so set its status to Hidden instead'});
    return;
  }

  const [, {count}] = await prisma.$transaction([
    prisma.favorite.deleteMany({where: {propertyId: id}}),
    prisma.property.deleteMany({where: {id}}),
  ]);
  if (count === 0) { res.status(404).json({error: 'Listing not found'}); return; }

  res.status(204).end();
});

export default router;
