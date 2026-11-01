import {getUserId, getQueryParam, getParam} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

function formatProperty(p: any, favIds: string[] = []) {
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

router.get('/', async (req: Request, res: Response) => {
  const type = getQueryParam(req, 'type');
  const city = getQueryParam(req, 'city');
  const search = getQueryParam(req, 'search');
  const featured = getQueryParam(req, 'featured');
  const userId = getUserId(req);

  const where: any = {};
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

  const properties = await prisma.property.findMany({where});

  let favIds: string[] = [];
  if (userId) {
    const favs = await prisma.favorite.findMany({where: {userId}, select: {propertyId: true}});
    favIds = favs.map(f => f.propertyId);
  }

  res.json({count: properties.length, properties: properties.map(p => formatProperty(p, favIds))});
});

router.get('/:id', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const property = await prisma.property.findUnique({where: {id: getParam(req, 'id')}});
  if (!property) { res.status(404).json({error: 'Property not found'}); return; }

  let favIds: string[] = [];
  if (userId) {
    const favs = await prisma.favorite.findMany({where: {userId}, select: {propertyId: true}});
    favIds = favs.map(f => f.propertyId);
  }

  res.json(formatProperty(property, favIds));
});

export default router;
