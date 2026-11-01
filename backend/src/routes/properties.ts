import {cleanNumber, getPaging, getUserId, getQueryParam, getParam} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

const SORT_ORDERS = new Map([
  ['price_low', {price: 'asc'}],
  ['price_high', {price: 'desc'}],
  ['rating', {rating: 'desc'}],
  ['newest', {yearBuilt: 'desc'}],
]);
const MAX_BEDROOMS_FILTER = 5; // The app's top option is "5+"
const MAX_CITIES = 100;

/** Booked, sold and hidden listings stay out of the app */
export const LISTED_STATUS = 'available';

export function formatProperty(p: any, favIds: string[] = []) {
  return {
    id: p.id, title: p.title, description: p.description,
    price: p.price, priceUnit: p.priceUnit, type: p.type, status: p.status,
    bedrooms: p.bedrooms, bathrooms: p.bathrooms, area: p.area, areaUnit: p.areaUnit,
    address: p.address, city: p.city, state: p.state, zipCode: p.zipCode,
    images: p.images, amenities: p.amenities,
    rating: p.rating, reviewCount: p.reviewCount, isFeatured: p.isFeatured,
    yearBuilt: p.yearBuilt, parkingSpaces: p.parkingSpaces,
    isFavorite: favIds.includes(p.id),
    agent: {
      id: `agent-${p.id}`, name: p.agentName, avatar: p.agentAvatar,
      phone: p.agentPhone, email: p.agentEmail,
      rating: p.agentRating, propertiesCount: p.agentListings,
    },
    coordinates: {latitude: p.latitude, longitude: p.longitude},
  };
}

// GET /api/properties/cities — cities with listings, for the app's filter
router.get('/cities', async (_req: Request, res: Response) => {
  const rows = await prisma.property.findMany({
    where: {status: LISTED_STATUS},
    distinct: ['city'],
    select: {city: true},
    orderBy: {city: 'asc'},
    take: MAX_CITIES,
  });
  res.json({cities: rows.map(r => r.city)});
});

router.get('/', async (req: Request, res: Response) => {
  const type = getQueryParam(req, 'type');
  const city = getQueryParam(req, 'city');
  const search = getQueryParam(req, 'search');
  const featured = getQueryParam(req, 'featured');
  const minPrice = cleanNumber(getQueryParam(req, 'minPrice'));
  const maxPrice = cleanNumber(getQueryParam(req, 'maxPrice'));
  const bedrooms = cleanNumber(getQueryParam(req, 'bedrooms'), 1);
  const sort = SORT_ORDERS.get(getQueryParam(req, 'sort') || '');
  const {page, limit, skip} = getPaging(req);
  const userId = getUserId(req);

  const where: any = {status: LISTED_STATUS};
  if (type && type !== 'all') { where.type = type as string; }
  if (city) { where.city = {equals: city as string, mode: 'insensitive'}; }
  if (search) {
    const q = search as string;
    where.OR = [
      {title: {contains: q, mode: 'insensitive'}},
      {city: {contains: q, mode: 'insensitive'}},
      {address: {contains: q, mode: 'insensitive'}},
      {type: {contains: q, mode: 'insensitive'}},
    ];
  }
  if (featured === 'true') { where.isFeatured = true; }
  if (minPrice !== undefined || maxPrice !== undefined) { where.price = {gte: minPrice, lte: maxPrice}; }
  if (bedrooms !== undefined) {
    where.bedrooms = bedrooms >= MAX_BEDROOMS_FILTER ? {gte: MAX_BEDROOMS_FILTER} : Math.trunc(bedrooms);
  }

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      // The id keeps the order stable, so nothing repeats or goes missing between pages
      orderBy: [sort || {createdAt: 'desc'}, {id: 'asc'}] as any,
      skip,
      take: limit,
    }),
    prisma.property.count({where}),
  ]);

  let favIds: string[] = [];
  if (userId) {
    const favs = await prisma.favorite.findMany({where: {userId}, select: {propertyId: true}});
    favIds = favs.map(f => f.propertyId);
  }

  res.json({
    count: properties.length, total, page, limit,
    hasMore: skip + properties.length < total,
    properties: properties.map(p => formatProperty(p, favIds)),
  });
});

router.get('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const property = await prisma.property.findFirst({where: {id: getParam(req, 'id'), status: LISTED_STATUS}});
  if (!property) { res.status(404).json({error: 'Property not found'}); return; }

  let favIds: string[] = [];
  if (userId) {
    const favs = await prisma.favorite.findMany({where: {userId}, select: {propertyId: true}});
    favIds = favs.map(f => f.propertyId);
  }

  res.json(formatProperty(property, favIds));
});

export default router;
