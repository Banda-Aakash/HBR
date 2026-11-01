import {PrismaClient} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// This script wipes every table, so it only ever runs against a local database
function assertLocalDatabase() {
  const url = process.env.DATABASE_URL || '';
  const isLocal = /@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
  if (process.env.NODE_ENV === 'production' || !isLocal) {
    throw new Error('Refusing to seed: this would delete all data in a non-local database.');
  }
}

async function main() {
  assertLocalDatabase();
  const seedPassword = await bcrypt.hash('password123', 10);

  // Clear all data
  await prisma.rentalInspectionItem.deleteMany();
  await prisma.rentalInspection.deleteMany();
  await prisma.rentalDocument.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.interiorLike.deleteMany();
  await prisma.interior.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing data.');

  // ── Users ──
  const u1 = await prisma.user.create({
    data: {
      id: 'u1',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      password: seedPassword,
      phone: '+1 555-0100',
      avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      roles: ['buyer', 'owner', 'admin'],
    },
  });
  const u2 = await prisma.user.create({
    data: {
      id: 'u2',
      name: 'Sarah Williams',
      email: 'sarah@example.com',
      password: seedPassword,
      phone: '+1 555-0200',
      avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
      roles: ['tenant'],
    },
  });
  console.log('Users created.');

  // ── Properties ──
  const props = [
    {
      id: 'p1', title: 'Luxury Skyline Penthouse',
      description: 'Stunning penthouse with panoramic city views, floor-to-ceiling windows, a private rooftop terrace.',
      price: 2500000, priceUnit: 'total', type: 'penthouse', bedrooms: 4, bathrooms: 3,
      area: 3200, address: '1200 Park Avenue', city: 'New York', state: 'NY', zipCode: '10128',
      images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'],
      amenities: ['Rooftop Terrace', 'Concierge', 'Gym', 'Pool', 'Parking', 'Smart Home'],
      rating: 4.9, reviewCount: 47, isFeatured: true, yearBuilt: 2022, parkingSpaces: 2,
      agentName: 'Sarah Mitchell', agentAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      agentPhone: '+1 212-555-0101', agentEmail: 'sarah.m@realapp.com', agentRating: 4.9, agentListings: 58,
      latitude: 40.785091, longitude: -73.968285,
    },
    {
      id: 'p2', title: 'Modern Beachfront Villa',
      description: 'A breathtaking beachfront villa featuring an infinity pool and direct beach access.',
      price: 4800000, priceUnit: 'total', type: 'villa', bedrooms: 5, bathrooms: 4,
      area: 4500, address: '88 Ocean Drive', city: 'Miami', state: 'FL', zipCode: '33139',
      images: ['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'],
      amenities: ['Infinity Pool', 'Beach Access', 'Home Theater', 'Wine Cellar', 'Smart Home'],
      rating: 4.8, reviewCount: 32, isFeatured: true, yearBuilt: 2023, parkingSpaces: 3,
      agentName: 'James Rodriguez', agentAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      agentPhone: '+1 305-555-0202', agentEmail: 'james.r@realapp.com', agentRating: 4.8, agentListings: 42,
      latitude: 25.77427, longitude: -80.13018,
    },
    {
      id: 'p3', title: 'Downtown Loft Apartment',
      description: 'Chic industrial loft with exposed brick and high ceilings in the heart of downtown.',
      price: 3500, priceUnit: 'month', type: 'apartment', bedrooms: 2, bathrooms: 2,
      area: 1400, address: '456 Main Street', city: 'Austin', state: 'TX', zipCode: '73301',
      images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
      amenities: ['Gym', 'Rooftop Lounge', 'Parking', 'Pet Friendly', 'In-Unit Laundry'],
      rating: 4.6, reviewCount: 89, isFeatured: false, yearBuilt: 2019, parkingSpaces: 1,
      agentName: 'Emily Chen', agentAvatar: 'https://randomuser.me/api/portraits/women/65.jpg',
      agentPhone: '+1 512-555-0303', agentEmail: 'emily.c@realapp.com', agentRating: 4.7, agentListings: 35,
      latitude: 30.267153, longitude: -97.743057,
    },
    {
      id: 'p4', title: 'Elegant Colonial House',
      description: 'A beautifully restored colonial home with modern amenities and a spacious backyard.',
      price: 1200000, priceUnit: 'total', type: 'house', bedrooms: 4, bathrooms: 3,
      area: 2800, address: '789 Elm Street', city: 'Charleston', state: 'SC', zipCode: '29401',
      images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'],
      amenities: ['Garden', 'Fireplace', 'Porch', 'Garage', 'Hardwood Floors', 'Central AC'],
      rating: 4.7, reviewCount: 28, isFeatured: true, yearBuilt: 1920, parkingSpaces: 2,
      agentName: 'Sarah Mitchell', agentAvatar: 'https://randomuser.me/api/portraits/women/44.jpg',
      agentPhone: '+1 212-555-0101', agentEmail: 'sarah.m@realapp.com', agentRating: 4.9, agentListings: 58,
      latitude: 32.776475, longitude: -79.93105,
    },
    {
      id: 'p5', title: 'Hillside Luxury Condo',
      description: 'A sleek condo perched on the hillside with sweeping valley views.',
      price: 850000, priceUnit: 'total', type: 'condo', bedrooms: 3, bathrooms: 2,
      area: 1800, address: '321 Hilltop Lane', city: 'Los Angeles', state: 'CA', zipCode: '90028',
      images: ['https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800'],
      amenities: ['Pool', 'Gym', 'Balcony', 'Concierge', 'Parking', 'Spa'],
      rating: 4.5, reviewCount: 56, isFeatured: false, yearBuilt: 2021, parkingSpaces: 2,
      agentName: 'Michael Park', agentAvatar: 'https://randomuser.me/api/portraits/men/75.jpg',
      agentPhone: '+1 310-555-0404', agentEmail: 'michael.p@realapp.com', agentRating: 4.6, agentListings: 67,
      latitude: 34.052235, longitude: -118.243683,
    },
    {
      id: 'p6', title: 'Waterfront Studio Apartment',
      description: 'Compact yet elegant studio with stunning water views.',
      price: 2200, priceUnit: 'month', type: 'apartment', bedrooms: 1, bathrooms: 1,
      area: 650, address: '55 Harbor Blvd', city: 'San Francisco', state: 'CA', zipCode: '94111',
      images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'],
      amenities: ['Water View', 'Gym', 'Doorman', 'Laundry', 'Bike Storage'],
      rating: 4.4, reviewCount: 112, isFeatured: false, yearBuilt: 2020, parkingSpaces: 0,
      agentName: 'James Rodriguez', agentAvatar: 'https://randomuser.me/api/portraits/men/32.jpg',
      agentPhone: '+1 305-555-0202', agentEmail: 'james.r@realapp.com', agentRating: 4.8, agentListings: 42,
      latitude: 37.774929, longitude: -122.419418,
    },
  ];

  for (const p of props) {
    await prisma.property.create({data: p});
  }
  console.log('Properties created.');

  // ── Favorites ──
  await prisma.favorite.createMany({
    data: [
      {userId: 'u1', propertyId: 'p2'},
      {userId: 'u1', propertyId: 'p5'},
    ],
  });
  console.log('Favorites created.');

  // ── Interiors ──
  const interiors = [
    {id: 'i1', title: 'Minimalist Scandinavian Living', category: 'living-room', description: 'A serene living space with clean lines and neutral tones.', images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'], designer: 'Anna Johansson', style: 'Scandinavian', tags: ['minimalist', 'neutral', 'cozy'], likes: 342},
    {id: 'i2', title: 'Industrial Modern Kitchen', category: 'kitchen', description: 'Bold kitchen with exposed brick and stainless steel.', images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800'], designer: 'Marco Bellini', style: 'Industrial', tags: ['industrial', 'modern', 'open-plan'], likes: 287},
    {id: 'i3', title: 'Coastal Retreat Bedroom', category: 'bedroom', description: 'A calming bedroom with soft blues and natural textures.', images: ['https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800'], designer: 'Olivia West', style: 'Coastal', tags: ['coastal', 'relaxing', 'blue'], likes: 415},
    {id: 'i4', title: 'Luxe Marble Bathroom', category: 'bathroom', description: 'Opulent bathroom in Calacatta marble with gold fixtures.', images: ['https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800'], designer: 'Laurent Dubois', style: 'Luxury', tags: ['luxury', 'marble', 'spa'], likes: 523},
    {id: 'i5', title: 'Mid-Century Home Office', category: 'office', description: 'Stylish home office with mid-century furniture.', images: ['https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'], designer: 'David Kim', style: 'Mid-Century Modern', tags: ['mid-century', 'workspace', 'productive'], likes: 198},
    {id: 'i6', title: 'Mediterranean Outdoor Lounge', category: 'outdoor', description: 'Warm outdoor area with terracotta and lush greenery.', images: ['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'], designer: 'Sofia Moreno', style: 'Mediterranean', tags: ['outdoor', 'mediterranean', 'lounge'], likes: 276},
    {id: 'i7', title: 'Japanese Zen Living Room', category: 'living-room', description: 'Tranquil space with low-profile furniture and tatami.', images: ['https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=800'], designer: 'Yuki Tanaka', style: 'Japandi', tags: ['zen', 'japanese', 'minimal'], likes: 389},
    {id: 'i8', title: 'Bohemian Eclectic Bedroom', category: 'bedroom', description: 'Vibrant bedroom with patterns and global influences.', images: ['https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=800'], designer: 'Priya Sharma', style: 'Bohemian', tags: ['bohemian', 'eclectic', 'colorful'], likes: 456},
  ];

  for (const i of interiors) {
    await prisma.interior.create({data: i});
  }
  console.log('Interiors created.');

  // ── Rentals ──
  const r1 = await prisma.rental.create({
    data: {
      id: 'ten-1', userId: 'u1', rentalState: 'onboarding', rent: 35000, deposit: 210000,
      maintenanceSpendLimit: 5000, propType: 'residential', propUnitNo: 'A-1204', propTower: 'Tower A',
      propFloor: 12, propCarpetArea: 1450, propFacing: 'East', propAddress: 'Prestige Lakeside Habitat',
      propLocality: 'Varthur', propCity: 'Bangalore',
      propImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      ownerName: 'Alex Johnson', ownerPhone: '+1 555-0100', ownerEmail: 'alex@example.com',
      ownerResidencyStatus: 'resident', ownerAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
  });
  await prisma.rentalDocument.createMany({
    data: [
      {rentalId: 'ten-1', type: 'poa', fileName: 'POA_Alex.pdf', isOnFile: true},
      {rentalId: 'ten-1', type: 'ownership_deed', fileName: 'Sale_Deed_A1204.pdf', isOnFile: true},
    ],
  });

  await prisma.rental.create({
    data: {
      id: 'ten-2', userId: 'u1', rentalState: 'marketing', rent: 22000, deposit: 132000,
      maintenanceSpendLimit: 3000, propType: 'residential', propUnitNo: 'B-305', propBlock: 'Block B',
      propFloor: 3, propCarpetArea: 980, propFacing: 'North', propAddress: 'My Home Bhooja',
      propLocality: 'Madhapur', propCity: 'Hyderabad',
      propImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      ownerName: 'Alex Johnson', ownerPhone: '+1 555-0100', ownerEmail: 'alex@example.com',
      ownerResidencyStatus: 'resident', ownerAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      documents: {
        create: [
          {type: 'poa', fileName: 'POA_Alex.pdf', isOnFile: true},
          {type: 'ownership_deed', fileName: 'Allotment_B305.pdf', isOnFile: true},
          {type: 'society_noc', fileName: 'NOC_Bhooja.pdf', isOnFile: true},
          {type: 'baseline_photos', fileName: 'Photos_B305.zip', isOnFile: true},
        ],
      },
    },
  });

  const r3 = await prisma.rental.create({
    data: {
      id: 'ten-3', userId: 'u1', rentalState: 'occupied', rent: 28000, deposit: 168000,
      maintenanceSpendLimit: 5000, startDate: '2026-04-01', endDate: '2027-03-31', escalationPct: 5,
      ownerApproval: true, depositReceived: true,
      propType: 'residential', propUnitNo: '402', propFloor: 4, propCarpetArea: 1200,
      propFacing: 'South', propAddress: 'Sobha Dream Acres', propLocality: 'Panathur', propCity: 'Bangalore',
      propImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      ownerName: 'Alex Johnson', ownerPhone: '+1 555-0100', ownerEmail: 'alex@example.com',
      ownerResidencyStatus: 'resident', ownerAvatar: 'https://randomuser.me/api/portraits/men/1.jpg',
      tenantName: 'TechStart Solutions Pvt Ltd', tenantPhone: '+91 88776 65544',
      tenantEmail: 'admin@techstart.in', tenantResidencyStatus: 'resident',
      documents: {
        create: [
          {type: 'agreement', fileName: 'Agreement_402.pdf', isOnFile: true},
          {type: 'police_verification', fileName: 'PV_TechStart.pdf', isOnFile: true},
          {type: 'move_in_inventory', fileName: 'MoveIn_402.pdf', isOnFile: true},
        ],
      },
    },
  });

  // Add inspection and ledger for ten-3
  await prisma.rentalInspection.create({
    data: {
      rentalId: 'ten-3', type: 'movein', conductedBy: 'Field Team', conductedAt: '2026-04-01',
      items: {
        create: [
          {room: 'Living Room', item: 'Flooring', condition: 'good'},
          {room: 'Kitchen', item: 'Countertop', condition: 'good'},
        ],
      },
    },
  });

  await prisma.ledgerEntry.createMany({
    data: [
      {rentalId: 'ten-3', date: '2026-04-05', direction: 'in', amount: 28000, category: 'rent', description: 'April 2026 rent'},
      {rentalId: 'ten-3', date: '2026-05-03', direction: 'in', amount: 28000, category: 'rent', description: 'May 2026 rent'},
      {rentalId: 'ten-3', date: '2026-05-12', direction: 'out', amount: 4500, category: 'maintenance', description: 'Plumbing repair'},
      {rentalId: 'ten-3', date: '2026-06-04', direction: 'in', amount: 28000, category: 'rent', description: 'June 2026 rent'},
    ],
  });

  console.log('Rentals with documents, inspections, and ledger created.');
  console.log('Seed complete!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
