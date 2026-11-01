import {cleanNumber, cleanString, getPaging, getUserId, getQueryParam, getParam, requireAuth} from '../helpers';
import {Router, Request, Response} from 'express';
import prisma from '../prisma';

const router = Router();

const TRANSITIONS: Record<string, string> = {
  onboarding: 'marketing', marketing: 'agreement', agreement: 'occupied',
  occupied: 'notice', notice: 'move_out', move_out: 'marketing',
};

// States a rental can be seen in by people other than its owner
const LISTED_STATES = ['marketing', 'occupied'];

const BOOLEAN_FIELDS = ['ownerApproval', 'depositReceived', 'depositSettled', 'duesCleared'];
const NUMBER_FIELDS = ['maintenanceSpendLimit', 'rent', 'deposit'];

function formatRental(r: any) {
  return {
    id: r.id, state: r.rentalState, rent: r.rent, deposit: r.deposit,
    maintenanceSpendLimit: r.maintenanceSpendLimit,
    startDate: r.startDate, endDate: r.endDate, escalationPct: r.escalationPct,
    ownerApproval: r.ownerApproval, depositReceived: r.depositReceived,
    depositSettled: r.depositSettled, duesCleared: r.duesCleared,
    createdAt: r.createdAt,
    property: {
      id: r.id, type: r.propType, unitNo: r.propUnitNo, tower: r.propTower,
      block: r.propBlock, floor: r.propFloor, carpetArea: r.propCarpetArea,
      facing: r.propFacing, address: r.propAddress, locality: r.propLocality,
      city: r.propCity, image: r.propImage,
    },
    owner: {
      id: r.userId, name: r.ownerName, phone: r.ownerPhone,
      email: r.ownerEmail, residencyStatus: r.ownerResidencyStatus,
      avatar: r.ownerAvatar,
    },
    tenant: r.tenantName ? {
      id: 'tenant', name: r.tenantName, phone: r.tenantPhone || '',
      email: r.tenantEmail || '', residencyStatus: r.tenantResidencyStatus || 'resident',
      avatar: r.tenantAvatar || '',
    } : undefined,
    documents: (r.documents || []).map((d: any) => ({
      id: d.id, type: d.type, fileName: d.fileName, isOnFile: d.isOnFile, createdAt: d.createdAt,
    })),
    inspections: (r.inspections || []).map((i: any) => ({
      id: i.id, type: i.type, conductedBy: i.conductedBy, conductedAt: i.conductedAt,
      items: (i.items || []).map((it: any) => ({id: it.id, room: it.room, item: it.item, condition: it.condition})),
    })),
    ledger: (r.ledger || []).map((l: any) => ({
      id: l.id, date: l.date, direction: l.direction, amount: l.amount,
      category: l.category, description: l.description,
    })),
  };
}

/** What anyone may see: no contact details, documents, money records or exact address */
function formatPublicRental(r: any) {
  const blankPerson = {id: '', name: '', phone: '', email: '', residencyStatus: 'resident', avatar: ''};
  return {
    id: r.id, state: r.rentalState, rent: r.rent, deposit: r.deposit,
    maintenanceSpendLimit: 0, ownerApproval: false, depositReceived: false,
    depositSettled: false, duesCleared: false, createdAt: r.createdAt,
    property: {
      id: r.id, type: r.propType, unitNo: '', floor: r.propFloor,
      carpetArea: r.propCarpetArea, facing: r.propFacing,
      address: `${r.propLocality}, ${r.propCity}`, locality: r.propLocality,
      city: r.propCity, image: r.propImage,
    },
    owner: blankPerson,
    documents: [], inspections: [], ledger: [],
  };
}

const rentalIncludes = {documents: true, inspections: {include: {items: true}}, ledger: true};

/** Find a rental belonging to the logged-in user */
function findOwnedRental(req: Request) {
  return prisma.rental.findFirst({
    where: {id: getParam(req, 'id'), userId: getUserId(req)},
    include: rentalIncludes,
  });
}

// GET /api/rentals/browse/all — tenant browsing
router.get('/browse/all', async (req: Request, res: Response) => {
  const search = getQueryParam(req, 'search');
  const {page, limit, skip} = getPaging(req);

  const where: any = {rentalState: {in: LISTED_STATES}};
  // Public fields only, searching the exact address would reveal where a rental is
  if (search) {
    where.OR = [
      {propLocality: {contains: search, mode: 'insensitive'}},
      {propCity: {contains: search, mode: 'insensitive'}},
    ];
  }

  const [rentals, total, available] = await Promise.all([
    prisma.rental.findMany({where, orderBy: [{createdAt: 'desc'}, {id: 'asc'}], skip, take: limit}),
    prisma.rental.count({where}),
    prisma.rental.count({where: {...where, rentalState: 'marketing'}}),
  ]);

  res.json({
    count: rentals.length, total, available, page, limit,
    hasMore: skip + rentals.length < total,
    rentals: rentals.map(formatPublicRental),
  });
});

router.use(requireAuth);

// GET /api/rentals — owner's rentals
router.get('/', async (req: Request, res: Response) => {
  const where: any = {userId: getUserId(req)};
  const state = getQueryParam(req, 'state');
  if (state && state !== 'all') { where.rentalState = state; }

  const rentals = await prisma.rental.findMany({where, include: rentalIncludes, orderBy: {createdAt: 'desc'}});
  res.json({count: rentals.length, rentals: rentals.map(formatRental)});
});

// POST /api/rentals — create new rental
router.post('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const {tower, floor, carpetArea, facing, locality, deposit, maintenanceSpendLimit, type} = req.body;
  const address = cleanString(req.body.address);
  const unitNo = cleanString(req.body.unitNo, 50);
  const city = cleanString(req.body.city, 100);
  const rent = cleanNumber(req.body.rent, 1);
  if (!address || !unitNo || !city || !rent) { res.status(400).json({error: 'address, unitNo, city, rent required'}); return; }

  const user = await prisma.user.findUnique({where: {id: userId}});
  if (!user) { res.status(404).json({error: 'User not found'}); return; }

  const rental = await prisma.rental.create({
    data: {
      userId, rentalState: 'onboarding', rent,
      deposit: cleanNumber(deposit) || rent * 6,
      maintenanceSpendLimit: cleanNumber(maintenanceSpendLimit) || 0,
      propType: cleanString(type, 50) || 'residential', propUnitNo: unitNo, propTower: cleanString(tower, 50) || null,
      propFloor: Math.trunc(cleanNumber(floor) || 0), propCarpetArea: cleanNumber(carpetArea) || 0,
      propFacing: cleanString(facing, 50) || null, propAddress: address, propLocality: cleanString(locality, 100) || city,
      propCity: city, propImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      ownerName: user.name, ownerPhone: user.phone, ownerEmail: user.email,
      ownerResidencyStatus: 'resident', ownerAvatar: user.avatar,
    },
    include: rentalIncludes,
  });

  res.status(201).json(formatRental(rental));
});

// GET /api/rentals/:id
router.get('/:id', async (req: Request, res: Response) => {
  const owned = await findOwnedRental(req);
  if (owned) { res.json(formatRental(owned)); return; }

  const listed = await prisma.rental.findFirst({
    where: {id: getParam(req, 'id'), rentalState: {in: LISTED_STATES}},
  });
  if (!listed) { res.status(404).json({error: 'Tenancy not found'}); return; }
  res.json(formatPublicRental(listed));
});

// POST /api/rentals/:id/transition
router.post('/:id/transition', async (req: Request, res: Response) => {
  const rental = await findOwnedRental(req);
  if (!rental) { res.status(404).json({error: 'Tenancy not found'}); return; }

  const nextState = TRANSITIONS[rental.rentalState];
  if (!nextState) { res.status(400).json({error: 'No transition available'}); return; }

  // Check guards
  const guards = getGuards(rental);
  const unmet = guards.filter(g => !g.satisfied);
  if (unmet.length > 0) {
    res.status(400).json({error: `Cannot transition: ${unmet.map(g => g.label).join(', ')}`});
    return;
  }

  const updated = await prisma.rental.update({
    where: {id: getParam(req, 'id')},
    data: {rentalState: nextState},
    include: rentalIncludes,
  });
  res.json(formatRental(updated));
});

// POST /api/rentals/:id/documents
router.post('/:id/documents', async (req: Request, res: Response) => {
  const type = cleanString(req.body.type, 50);
  const fileName = cleanString(req.body.fileName, 255);
  if (!type || !fileName) { res.status(400).json({error: 'type and fileName required'}); return; }

  const rental = await findOwnedRental(req);
  if (!rental) { res.status(404).json({error: 'Tenancy not found'}); return; }

  const doc = await prisma.rentalDocument.create({
    data: {rentalId: getParam(req, 'id'), type, fileName, isOnFile: true},
  });
  res.status(201).json(doc);
});

// PATCH /api/rentals/:id
router.patch('/:id', async (req: Request, res: Response) => {
  const data: any = {};
  for (const key of BOOLEAN_FIELDS) {
    if (req.body[key] === undefined) { continue; }
    if (typeof req.body[key] !== 'boolean') { res.status(400).json({error: `${key} must be true or false`}); return; }
    data[key] = req.body[key];
  }
  for (const key of NUMBER_FIELDS) {
    if (req.body[key] === undefined) { continue; }
    const value = cleanNumber(req.body[key]);
    if (value === undefined) { res.status(400).json({error: `${key} must be a positive number`}); return; }
    data[key] = value;
  }

  const rental = await findOwnedRental(req);
  if (!rental) { res.status(404).json({error: 'Tenancy not found'}); return; }

  const updated = await prisma.rental.update({where: {id: getParam(req, 'id')}, data, include: rentalIncludes});
  res.json(formatRental(updated));
});

function getGuards(rental: any) {
  const hasDoc = (type: string) => rental.documents?.some((d: any) => d.type === type && d.isOnFile);
  const hasInsp = (type: string) => rental.inspections?.some((i: any) => i.type === type);
  const st = rental.rentalState;
  const map: Record<string, {label: string; satisfied: boolean}[]> = {
    onboarding: [
      {label: 'POA on file', satisfied: hasDoc('poa')},
      {label: 'Ownership docs', satisfied: hasDoc('ownership_deed')},
      {label: 'Society NOC', satisfied: hasDoc('society_noc')},
      {label: 'Baseline photos', satisfied: hasDoc('baseline_photos')},
      {label: 'Maintenance limit', satisfied: (rental.maintenanceSpendLimit || 0) > 0},
    ],
    marketing: [
      {label: 'Screening report', satisfied: hasDoc('screening_report')},
      {label: 'Owner approval', satisfied: rental.ownerApproval},
    ],
    agreement: [
      {label: 'Signed agreement', satisfied: hasDoc('agreement')},
      {label: 'Deposit received', satisfied: rental.depositReceived},
      {label: 'Police verification', satisfied: hasDoc('police_verification')},
      {label: 'Move-in inventory', satisfied: hasDoc('move_in_inventory') && hasInsp('movein')},
    ],
    occupied: [{label: 'Notice document', satisfied: hasDoc('notice_document')}],
    notice: [{label: 'Move-out inspection', satisfied: hasInsp('moveout') && hasInsp('movein')}],
    move_out: [
      {label: 'Deposit settled', satisfied: rental.depositSettled},
      {label: 'Dues cleared', satisfied: rental.duesCleared},
      {label: 'Final statement', satisfied: hasDoc('final_statement')},
    ],
  };
  return map[st] || [];
}

export default router;
