import {after, before, describe, it, mock} from 'node:test';
import assert from 'node:assert/strict';
import {AddressInfo} from 'node:net';
import {Server} from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.AUTH_RATE_LIMIT = '1000';
process.env.API_RATE_LIMIT = '100000';
process.env.ALLOWED_ORIGINS = 'https://desk.test';

const url = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\/.*test/.test(url)) {
  throw new Error('Tests delete data: DATABASE_URL must be a local database with "test" in its name.');
}

// Imported after the env is set, because the rate limiters read it on load
const app = require('./app').default;
const prisma = require('./prisma').default;
const {getTrustProxyHops} = require('./helpers');
const {currentFestival, FESTIVAL_DATES, todayInIndia} = require('./festivals');

let server: Server;
let base: string;

const daysFromNow = (days: number) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
const statuses = (results: {status: number}[]) => results.map(r => r.status).sort();

async function call(method: string, path: string, opts: {token?: string; body?: unknown; headers?: Record<string, string>} = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.token ? {Authorization: `Bearer ${opts.token}`} : {}),
      ...opts.headers,
    },
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
  const text = await res.text();
  return {status: res.status, body: text ? JSON.parse(text) : null, text};
}

async function clearData() {
  await prisma.interiorLike.deleteMany();
  await prisma.interior.deleteMany();
  await prisma.rentalDocument.deleteMany();
  await prisma.rental.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();
}

const PASSWORD = 'correct-horse-battery';
let alice: {token: string; id: string};
let bob: {token: string; id: string};
let rentalId: string;
let propertyId: string;

before(async () => {
  await clearData();
  server = app.listen(0);
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api`;

  const a = await call('POST', '/auth/register', {body: {name: 'Alice', email: 'Alice@Test.com', password: PASSWORD}});
  const b = await call('POST', '/auth/register', {body: {name: 'Bob', email: 'bob@test.com', password: PASSWORD}});
  alice = {token: a.body.token, id: a.body.user.id};
  bob = {token: b.body.token, id: b.body.user.id};

  const rental = await call('POST', '/rentals', {
    token: alice.token,
    body: {address: '1 Secret Road', unitNo: 'A-101', city: 'Hyderabad', locality: 'Madhapur', rent: 30000},
  });
  rentalId = rental.body.id;

  const property = await prisma.property.create({
    data: {title: 'Test Home', description: 'x', price: 1, priceUnit: 'total', type: 'house', bedrooms: 1, bathrooms: 1, area: 1, address: 'x', city: 'x', state: 'x', images: [], amenities: []},
  });
  propertyId = property.id;
});

after(async () => {
  await clearData();
  await prisma.$disconnect();
  await new Promise(resolve => server.close(resolve));
});

describe('passwords', () => {
  it('stores a hash, never the password', async () => {
    const user = await prisma.user.findUnique({where: {id: alice.id}});
    assert.notEqual(user.password, PASSWORD);
    assert.ok(await bcrypt.compare(PASSWORD, user.password));
  });

  it('never returns the password', async () => {
    const res = await call('POST', '/auth/login', {body: {email: 'alice@test.com', password: PASSWORD}});
    assert.equal(res.status, 200);
    assert.equal(res.body.user.password, undefined);
  });

  it('rejects a wrong password', async () => {
    const res = await call('POST', '/auth/login', {body: {email: 'alice@test.com', password: 'wrong'}});
    assert.equal(res.status, 401);
  });

  it('rejects short passwords', async () => {
    const res = await call('POST', '/auth/register', {body: {name: 'C', email: 'c@test.com', password: 'short'}});
    assert.equal(res.status, 400);
  });

  it('never accepts a password stored as plain text', async () => {
    await prisma.user.create({data: {name: 'Old', email: 'old@test.com', password: 'plain-text-pass'}});
    const res = await call('POST', '/auth/login', {body: {email: 'old@test.com', password: 'plain-text-pass'}});
    assert.equal(res.status, 401);
  });
});

describe('production settings', () => {
  const withEnv = (env: Record<string, string | undefined>, run: () => void) => {
    const saved = {NODE_ENV: process.env.NODE_ENV, TRUST_PROXY_HOPS: process.env.TRUST_PROXY_HOPS};
    Object.assign(process.env, {NODE_ENV: env.NODE_ENV});
    if (env.TRUST_PROXY_HOPS === undefined) { delete process.env.TRUST_PROXY_HOPS; } else { process.env.TRUST_PROXY_HOPS = env.TRUST_PROXY_HOPS; }
    try {
      run();
    } finally {
      if (saved.NODE_ENV === undefined) { delete process.env.NODE_ENV; } else { process.env.NODE_ENV = saved.NODE_ENV; }
      if (saved.TRUST_PROXY_HOPS === undefined) { delete process.env.TRUST_PROXY_HOPS; } else { process.env.TRUST_PROXY_HOPS = saved.TRUST_PROXY_HOPS; }
    }
  };

  it('refuses to start in production without TRUST_PROXY_HOPS', () => {
    withEnv({NODE_ENV: 'production'}, () => assert.throws(getTrustProxyHops, /TRUST_PROXY_HOPS/));
  });

  it('accepts an explicit 0 in production', () => {
    withEnv({NODE_ENV: 'production', TRUST_PROXY_HOPS: '0'}, () => assert.equal(getTrustProxyHops(), 0));
  });

  it('rejects a value that is not a whole number', () => {
    withEnv({NODE_ENV: 'production', TRUST_PROXY_HOPS: 'one'}, () => assert.throws(getTrustProxyHops, /whole number/));
  });

  it('defaults to 0 outside production', () => {
    withEnv({NODE_ENV: 'development'}, () => assert.equal(getTrustProxyHops(), 0));
  });
});

describe('health check', () => {
  it('reports a working database', async () => {
    const res = await call('GET', '/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'ok');
  });

  it('reports when the database is down', async () => {
    const realQuery = prisma.$queryRaw;
    prisma.$queryRaw = () => Promise.reject(new Error('database down'));
    const silenced = mock.method(console, 'error', () => {});
    const res = await call('GET', '/health');
    prisma.$queryRaw = realQuery;
    silenced.mock.restore();
    assert.equal(res.status, 503);
    assert.equal(res.body.status, 'unavailable');
  });
});

describe('tokens', () => {
  it('ignores a forged x-user-id header', async () => {
    const res = await call('GET', '/rentals', {headers: {'x-user-id': alice.id}});
    assert.equal(res.status, 401);
  });

  it('rejects the old mock token format', async () => {
    const res = await call('GET', '/auth/me', {token: `mock-token-${alice.id}`});
    assert.equal(res.status, 401);
  });

  it('rejects a token signed with another secret', async () => {
    const forged = jwt.sign({}, 'attacker-secret-attacker-secret-1234', {subject: alice.id});
    const res = await call('GET', '/auth/me', {token: forged});
    assert.equal(res.status, 401);
  });

  it('rejects an unsigned token', async () => {
    const forged = jwt.sign({}, '', {subject: alice.id, algorithm: 'none'});
    const res = await call('GET', '/auth/me', {token: forged});
    assert.equal(res.status, 401);
  });

  it('accepts a real token', async () => {
    const res = await call('GET', '/auth/me', {token: alice.token});
    assert.equal(res.status, 200);
    assert.equal(res.body.user.id, alice.id);
  });
});

describe('rental ownership', () => {
  it('lets the owner read the full rental', async () => {
    const res = await call('GET', `/rentals/${rentalId}`, {token: alice.token});
    assert.equal(res.status, 200);
    assert.equal(res.body.property.unitNo, 'A-101');
  });

  it('hides an unlisted rental from other users', async () => {
    assert.equal((await call('GET', `/rentals/${rentalId}`, {token: bob.token})).status, 404);
  });

  it('blocks anonymous access', async () => {
    assert.equal((await call('GET', `/rentals/${rentalId}`)).status, 401);
  });

  it('blocks other users from changing a rental', async () => {
    const res = await call('PATCH', `/rentals/${rentalId}`, {token: bob.token, body: {depositReceived: true}});
    assert.equal(res.status, 404);
    const rental = await prisma.rental.findUnique({where: {id: rentalId}});
    assert.equal(rental.depositReceived, false);
  });

  it('blocks other users from adding documents or moving state', async () => {
    const doc = await call('POST', `/rentals/${rentalId}/documents`, {token: bob.token, body: {type: 'poa', fileName: 'x.pdf'}});
    assert.equal(doc.status, 404);
    assert.equal((await call('POST', `/rentals/${rentalId}/transition`, {token: bob.token})).status, 404);
  });

  it('rejects invalid field types', async () => {
    const res = await call('PATCH', `/rentals/${rentalId}`, {token: alice.token, body: {rent: 'free'}});
    assert.equal(res.status, 400);
  });
});

describe('public rental data', () => {
  before(async () => {
    await prisma.rental.update({
      where: {id: rentalId},
      data: {rentalState: 'marketing', tenantName: 'Private Tenant', tenantPhone: '+91 99999 00000', tenantEmail: 'tenant@test.com'},
    });
    await prisma.rentalDocument.create({data: {rentalId, type: 'poa', fileName: 'private.pdf'}});
    await prisma.ledgerEntry.create({data: {rentalId, date: '2026-01-01', direction: 'in', amount: 5000, category: 'rent', description: 'private ledger'}});
  });

  after(async () => {
    await prisma.ledgerEntry.deleteMany();
  });

  const SECRETS = ['Private Tenant', '99999', 'tenant@test.com', 'private.pdf', 'private ledger', '1 Secret Road', 'A-101', 'alice@test.com'];

  it('removes private details from the browse list', async () => {
    const res = await call('GET', '/rentals/browse/all');
    assert.equal(res.status, 200);
    assert.equal(res.body.count, 1);
    for (const secret of SECRETS) { assert.ok(!res.text.includes(secret), `leaked: ${secret}`); }
  });

  it('removes private details from the listing page', async () => {
    const res = await call('GET', `/rentals/${rentalId}`, {token: bob.token});
    assert.equal(res.status, 200);
    for (const secret of SECRETS) { assert.ok(!res.text.includes(secret), `leaked: ${secret}`); }
  });

  it('pages the browse list and counts what is available', async () => {
    await call('POST', '/rentals', {token: alice.token, body: {address: 'B', unitNo: 'B-1', city: 'Pune', rent: 20000}});
    const second = await call('POST', '/rentals', {token: alice.token, body: {address: 'C', unitNo: 'C-1', city: 'Pune', rent: 20000}});
    await prisma.rental.update({where: {id: second.body.id}, data: {rentalState: 'occupied'}});

    const res = await call('GET', '/rentals/browse/all?limit=1');
    assert.equal(res.body.count, 1);
    assert.equal(res.body.total, 2);
    assert.equal(res.body.available, 1);
    assert.equal(res.body.hasMore, true);
  });

  it('searches public location fields only', async () => {
    assert.equal((await call('GET', '/rentals/browse/all?search=madhapur')).body.total, 1);
    assert.equal((await call('GET', '/rentals/browse/all?search=Secret')).body.total, 0);
  });
});

describe('property listings', () => {
  const homes = [
    {title: 'One', price: 1000000, bedrooms: 1, rating: 3},
    {title: 'Two', price: 2000000, bedrooms: 2, rating: 5},
    {title: 'Three', price: 3000000, bedrooms: 5, rating: 4},
    {title: 'Four', price: 4000000, bedrooms: 6, rating: 2},
  ];
  const titles = (res: {body: {properties: {title: string}[]}}) => res.body.properties.map(p => p.title);

  before(async () => {
    await prisma.booking.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.property.deleteMany();
    await prisma.property.createMany({
      data: homes.map(h => ({...h, description: 'x', priceUnit: 'total', type: 'house', bathrooms: 1, area: 1, address: 'x', city: 'x', state: 'x', images: [], amenities: []})),
    });
  });

  after(async () => {
    await prisma.property.deleteMany();
    const property = await prisma.property.create({
      data: {title: 'Test Home', description: 'x', price: 1, priceUnit: 'total', type: 'house', bedrooms: 1, bathrooms: 1, area: 1, address: 'x', city: 'x', state: 'x', images: [], amenities: []},
    });
    propertyId = property.id;
  });

  it('walks through every home once across pages', async () => {
    const first = await call('GET', '/properties?limit=3');
    const second = await call('GET', '/properties?limit=3&page=2');
    assert.equal(first.body.total, 4);
    assert.equal(first.body.hasMore, true);
    assert.equal(second.body.hasMore, false);
    assert.equal(new Set([...titles(first), ...titles(second)]).size, 4);
  });

  it('filters by price on the server', async () => {
    const res = await call('GET', '/properties?minPrice=2000000&maxPrice=3000000');
    assert.deepEqual(titles(res).sort(), ['Three', 'Two']);
  });

  it('filters by bedrooms, treating 5 as 5 or more', async () => {
    assert.deepEqual(titles(await call('GET', '/properties?bedrooms=2')), ['Two']);
    assert.deepEqual(titles(await call('GET', '/properties?bedrooms=5')).sort(), ['Four', 'Three']);
  });

  it('sorts on the server', async () => {
    assert.deepEqual(titles(await call('GET', '/properties?sort=price_high')), ['Four', 'Three', 'Two', 'One']);
    assert.deepEqual(titles(await call('GET', '/properties?sort=rating')), ['Two', 'Three', 'One', 'Four']);
  });

  it('survives bad paging and sort values', async () => {
    for (const query of ['page=abc', 'limit=-1', 'page=1e308', 'limit=0', 'sort=constructor', 'bedrooms=1e308', 'minPrice=abc']) {
      assert.equal((await call('GET', `/properties?${query}`)).status, 200, query);
    }
  });

  it('caps the page size', async () => {
    assert.equal((await call('GET', '/properties?limit=100000')).body.limit, 100);
  });
});

describe('bookings', () => {
  const book = (overrides: Record<string, string> = {}, token = alice.token) =>
    call('POST', '/bookings', {token, body: {propertyId, date: daysFromNow(3), time: '10:00 AM', ...overrides}});

  it('creates a request that waits to be confirmed', async () => {
    const res = await book({time: '9:00 AM'});
    assert.equal(res.status, 201);
    assert.equal(res.body.booking.status, 'pending');
  });

  it('accepts today', async () => {
    assert.equal((await book({date: daysFromNow(0)})).status, 201);
  });

  it('rejects past, impossible and badly written dates', async () => {
    for (const date of ['1999-01-01', daysFromNow(-2), '2099-02-31', '2099-13-01', 'next week', '01/12/2099']) {
      assert.equal((await book({date})).status, 400, date);
    }
  });

  it('rejects times that are not real', async () => {
    for (const time of ['banana', '25:00 PM', '13:00 PM', '10:60 AM', '10:00']) {
      assert.equal((await book({time})).status, 400, time);
    }
  });

  it('rejects a second booking for the same slot', async () => {
    assert.equal((await book({time: '1:00 PM'})).status, 201);
    const again = await book({time: '1:00 PM'});
    assert.equal(again.status, 409);
    assert.match(again.body.error, /already have a visit/);
  });

  it('keeps one booking when the same slot arrives at once', async () => {
    const results = await Promise.all([book({time: '2:00 PM'}), book({time: '2:00 PM'}), book({time: '2:00 PM'})]);
    assert.deepEqual(statuses(results), [201, 409, 409]);
  });

  it('frees the slot once the visit is cancelled', async () => {
    const first = await book({time: '3:00 PM'});
    await call('PATCH', `/bookings/${first.body.booking.id}/cancel`, {token: alice.token});
    assert.equal((await book({time: '3:00 PM'})).status, 201);
  });

  it('lets two people book the same slot', async () => {
    assert.equal((await book({time: '4:00 PM'})).status, 201);
    assert.equal((await book({time: '4:00 PM'}, bob.token)).status, 201);
  });
});

describe('repeat taps', () => {
  it('handles a favourite tapped many times at once', async () => {
    const results = await Promise.all(Array.from({length: 6}, () =>
      call('POST', '/favorites/toggle', {token: alice.token, body: {propertyId}})));
    assert.deepEqual(statuses(results), [200, 200, 200, 200, 200, 200]);
  });

  it('keeps the like count right when tapped many times at once', async () => {
    const interior = await prisma.interior.create({data: {title: 'I', category: 'luxury', description: 'x', images: [], designer: 'x', style: 'x', tags: []}});
    const results = await Promise.all(Array.from({length: 6}, () =>
      call('POST', `/interiors/${interior.id}/like`, {token: alice.token})));
    assert.deepEqual(statuses(results), [200, 200, 200, 200, 200, 200]);

    const updated = await prisma.interior.findUnique({where: {id: interior.id}});
    assert.equal(updated.likes, await prisma.interiorLike.count({where: {interiorId: interior.id}}));
  });

  it('creates one account when the same signup arrives at once', async () => {
    const signup = () => call('POST', '/auth/register', {body: {name: 'Rae', email: 'rae@test.com', password: PASSWORD}});
    const results = await Promise.all([signup(), signup(), signup()]);
    assert.deepEqual(statuses(results), [201, 409, 409]);
  });
});

describe('bad requests do not crash the server', () => {
  it('handles non-string login fields', async () => {
    const res = await call('POST', '/auth/login', {body: {email: {contains: 'a'}, password: {not: ''}}});
    assert.equal(res.status, 400);
  });

  it('handles an empty login body', async () => {
    assert.equal((await call('POST', '/auth/login')).status, 400);
  });

  it('handles malformed JSON', async () => {
    const res = await fetch(`${base}/auth/login`, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: '{bad'});
    assert.equal(res.status, 400);
  });

  it('handles a favourite for a missing property', async () => {
    const res = await call('POST', '/favorites/toggle', {token: alice.token, body: {propertyId: 'nope'}});
    assert.equal(res.status, 404);
  });

  it('is still running afterwards', async () => {
    assert.equal((await call('GET', '/health')).status, 200);
  });
});

describe('favourites', () => {
  it('returns saved properties in the same shape as listings', async () => {
    await call('POST', '/favorites/toggle', {token: bob.token, body: {propertyId}});
    const res = await call('GET', '/favorites', {token: bob.token});
    assert.equal(res.body.count, 1);
    assert.equal(res.body.properties[0].isFavorite, true);
    assert.ok(res.body.properties[0].agent);
  });
});

describe('admin access', () => {
  const ROUTES = [
    ['GET', '/admin/summary'], ['GET', '/admin/bookings'], ['PATCH', '/admin/bookings/x'],
    ['GET', '/admin/properties'], ['POST', '/admin/properties'], ['PUT', '/admin/properties/x'], ['DELETE', '/admin/properties/x'],
  ];

  it('turns away anyone not signed in', async () => {
    for (const [method, path] of ROUTES) { assert.equal((await call(method, path)).status, 401, path); }
  });

  it('turns away ordinary users', async () => {
    for (const [method, path] of ROUTES) { assert.equal((await call(method, path, {token: alice.token})).status, 403, path); }
  });

  it('ignores a role sent during sign up', async () => {
    const res = await call('POST', '/auth/register', {body: {name: 'Mal', email: 'mal@test.com', password: PASSWORD, roles: ['admin']}});
    assert.deepEqual(res.body.user.roles, ['buyer']);
    assert.equal((await call('GET', '/admin/summary', {token: res.body.token})).status, 403);
  });

  it('ends access as soon as the role is removed', async () => {
    const res = await call('POST', '/auth/register', {body: {name: 'Sam', email: 'sam@test.com', password: PASSWORD}});
    await prisma.user.update({where: {id: res.body.user.id}, data: {roles: ['buyer', 'admin']}});
    assert.equal((await call('GET', '/admin/summary', {token: res.body.token})).status, 200);

    await prisma.user.update({where: {id: res.body.user.id}, data: {roles: ['buyer']}});
    assert.equal((await call('GET', '/admin/summary', {token: res.body.token})).status, 403);
  });

  const preflight = (origin: string) => fetch(`${base}/admin/summary`, {
    method: 'OPTIONS',
    headers: {Origin: origin, 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'authorization'},
  });

  it('lets the admin website call the API from its own address', async () => {
    const res = await preflight('https://desk.test');
    assert.equal(res.headers.get('access-control-allow-origin'), 'https://desk.test');
    assert.match(res.headers.get('access-control-allow-headers') || '', /authorization/i);
  });

  it('keeps other websites out', async () => {
    assert.equal((await preflight('https://evil.test')).headers.get('access-control-allow-origin'), null);
  });

  it('no longer serves a website itself', async () => {
    assert.equal((await fetch(`${base.replace('/api', '')}/admin/`)).status, 404);
  });
});

describe('admin listings', () => {
  const listing = {
    title: 'Lake View', description: 'Bright home', address: '1 Lake Road', city: 'Hyderabad', state: 'Telangana',
    price: 4500000, priceUnit: 'total', type: 'apartment', status: 'available', bedrooms: 2, bathrooms: 2,
    area: 1200, yearBuilt: 2020, images: ['https://example.com/a.jpg'], amenities: ['Gym'],
  };
  let admin: string;
  let listingId: string;

  before(async () => {
    const res = await call('POST', '/auth/register', {body: {name: 'Ada', email: 'ada@test.com', password: PASSWORD}});
    await prisma.user.update({where: {id: res.body.user.id}, data: {roles: ['buyer', 'admin']}});
    admin = res.body.token;
  });

  const save = (status: string) => call('PUT', `/admin/properties/${listingId}`, {token: admin, body: {...listing, status}});

  it('adds a listing the app can see straight away', async () => {
    const res = await call('POST', '/admin/properties', {token: admin, body: listing});
    assert.equal(res.status, 201);
    listingId = res.body.id;

    const visible = await call('GET', `/properties/${listingId}`);
    assert.equal(visible.status, 200);
    assert.equal(visible.body.title, 'Lake View');
    assert.equal(visible.body.rating, 0);
    assert.ok((await call('GET', '/properties/cities')).body.cities.includes('Hyderabad'));
  });

  it('rejects listings that would break the app', async () => {
    const bad = [
      {title: ''}, {description: ' '}, {city: ''}, {price: 0}, {price: 'free'}, {area: 0}, {bedrooms: 1.5}, {bedrooms: 1e12},
      {yearBuilt: 1200}, {type: 'castle'}, {status: 'gone'}, {priceUnit: 'weekly'}, {images: []}, {images: 'x'},
      {images: ['http://example.com/a.jpg']}, {images: ['javascript:alert(1)']}, {images: Array(11).fill('https://x.com/a.jpg')},
      {amenities: ['']},
    ];
    for (const fields of bad) {
      const res = await call('POST', '/admin/properties', {token: admin, body: {...listing, ...fields}});
      assert.equal(res.status, 400, JSON.stringify(fields).slice(0, 60));
    }
  });

  it('edits a listing', async () => {
    const res = await call('PUT', `/admin/properties/${listingId}`, {token: admin, body: {...listing, title: 'Lake View Heights', isFeatured: true}});
    assert.equal(res.status, 200);
    assert.equal(res.body.title, 'Lake View Heights');
    assert.equal(res.body.isFeatured, true);
  });

  it('takes a listing out of the app unless it is available', async () => {
    await call('POST', '/favorites/toggle', {token: alice.token, body: {propertyId: listingId}});

    for (const status of ['hidden', 'sold', 'booked']) {
      assert.equal((await save(status)).status, 200, status);
      const list = await call('GET', '/properties?limit=100');
      assert.ok(!list.text.includes(listingId), `listed while ${status}`);
      assert.equal((await call('GET', `/properties/${listingId}`)).status, 404, status);
      assert.ok(!(await call('GET', '/properties/cities')).body.cities.includes('Hyderabad'), status);
      assert.ok(!(await call('GET', '/favorites', {token: alice.token})).text.includes(listingId), status);
      const booking = await call('POST', '/bookings', {token: alice.token, body: {propertyId: listingId, date: daysFromNow(3), time: '5:00 PM'}});
      assert.equal(booking.status, 404, status);
    }
  });

  it('keeps hidden listings on the admin list', async () => {
    const res = await call('GET', '/admin/properties?search=heights', {token: admin});
    assert.equal(res.body.total, 0);
    const all = await call('GET', '/admin/properties?search=lake', {token: admin});
    assert.equal(all.body.properties[0].status, 'booked');
  });

  it('brings a listing back when it is available again', async () => {
    await save('available');
    assert.equal((await call('GET', `/properties/${listingId}`)).status, 200);
    assert.ok((await call('GET', '/favorites', {token: alice.token})).text.includes(listingId));
  });

  it('refuses to delete a listing with visit history', async () => {
    const booking = await call('POST', '/bookings', {token: alice.token, body: {propertyId: listingId, date: daysFromNow(3), time: '5:00 PM'}});
    assert.equal(booking.status, 201);

    const res = await call('DELETE', `/admin/properties/${listingId}`, {token: admin});
    assert.equal(res.status, 409);
    assert.match(res.body.error, /Hidden/);
  });

  it('deletes a listing without visits, including saves of it', async () => {
    const created = await call('POST', '/admin/properties', {token: admin, body: listing});
    await call('POST', '/favorites/toggle', {token: alice.token, body: {propertyId: created.body.id}});

    assert.equal((await call('DELETE', `/admin/properties/${created.body.id}`, {token: admin})).status, 204);
    assert.equal(await prisma.favorite.count({where: {propertyId: created.body.id}}), 0);
  });

  it('reports a missing listing', async () => {
    assert.equal((await call('PUT', '/admin/properties/nope', {token: admin, body: listing})).status, 404);
    assert.equal((await call('DELETE', '/admin/properties/nope', {token: admin})).status, 404);
  });
});

describe('admin visits', () => {
  let admin: string;
  let visitId: string;

  const request = async (time: string) => {
    const res = await call('POST', '/bookings', {token: alice.token, body: {propertyId, date: daysFromNow(5), time, notes: '<b>Near the gate</b>'}});
    assert.equal(res.status, 201);
    return res.body.booking.id as string;
  };
  const review = (id: string, status: string) => call('PATCH', `/admin/bookings/${id}`, {token: admin, body: {status}});

  before(async () => {
    const res = await call('POST', '/auth/login', {body: {email: 'ada@test.com', password: PASSWORD}});
    admin = res.body.token;
    await prisma.booking.deleteMany();
    visitId = await request('9:00 AM');
  });

  it('lists waiting requests with who asked, and no password', async () => {
    const res = await call('GET', '/admin/bookings', {token: admin});
    assert.equal(res.body.total, 1);
    assert.equal(res.body.bookings[0].user.email, 'alice@test.com');
    assert.equal(res.body.bookings[0].property.title, 'Test Home');
    assert.ok(!res.text.includes('password'));
  });

  it('counts what is waiting', async () => {
    assert.equal((await call('GET', '/admin/summary', {token: admin})).body.pendingBookings, 1);
  });

  it('confirms a visit, and the customer sees it', async () => {
    const res = await review(visitId, 'confirmed');
    assert.equal(res.status, 200);
    assert.equal(res.body.status, 'confirmed');

    const mine = await call('GET', '/bookings', {token: alice.token});
    assert.equal(mine.body.bookings.find((b: {id: string}) => b.id === visitId).status, 'confirmed');
    assert.equal((await call('GET', '/admin/bookings', {token: admin})).body.total, 0);
    assert.equal((await call('GET', '/admin/bookings?status=confirmed', {token: admin})).body.total, 1);
  });

  it('cancels a visit', async () => {
    assert.equal((await review(visitId, 'cancelled')).body.status, 'cancelled');
  });

  it('keeps a cancelled visit cancelled', async () => {
    const res = await review(visitId, 'confirmed');
    assert.equal(res.status, 409);
    const visit = await prisma.booking.findUnique({where: {id: visitId}});
    assert.equal(visit.status, 'cancelled');
  });

  it('rejects other statuses', async () => {
    assert.equal((await review(await request('10:00 AM'), 'pending')).status, 400);
  });

  it('reports a missing visit', async () => {
    assert.equal((await review('nope', 'confirmed')).status, 404);
  });
});

describe('account deletion', () => {
  it('needs the correct password', async () => {
    const res = await call('DELETE', '/auth/me', {token: bob.token, body: {password: 'wrong'}});
    assert.equal(res.status, 403);
    assert.ok(await prisma.user.findUnique({where: {id: bob.id}}));
  });

  it('removes the user and their data', async () => {
    const booking = await call('POST', '/bookings', {token: bob.token, body: {propertyId, date: daysFromNow(3), time: '10:00 AM'}});
    assert.equal(booking.status, 201);
    const created = await call('POST', '/rentals', {token: bob.token, body: {address: 'x', unitNo: '1', city: 'x', rent: 1}});
    await call('POST', `/rentals/${created.body.id}/documents`, {token: bob.token, body: {type: 'poa', fileName: 'x.pdf'}});

    const res = await call('DELETE', '/auth/me', {token: bob.token, body: {password: PASSWORD}});
    assert.equal(res.status, 204);
    assert.equal(await prisma.user.findUnique({where: {id: bob.id}}), null);
    assert.equal(await prisma.booking.count({where: {userId: bob.id}}), 0);
    assert.equal(await prisma.favorite.count({where: {userId: bob.id}}), 0);
    assert.equal(await prisma.rental.count({where: {userId: bob.id}}), 0);
  });

  it('treats the old token as logged out', async () => {
    assert.equal((await call('GET', '/auth/me', {token: bob.token})).status, 401);
    const booking = await call('POST', '/bookings', {token: bob.token, body: {propertyId, date: daysFromNow(3), time: '11:00 AM'}});
    assert.equal(booking.status, 401);
    const favourite = await call('POST', '/favorites/toggle', {token: bob.token, body: {propertyId}});
    assert.equal(favourite.status, 401);
  });
});

describe('festive theme', () => {
  it('names the festival on its days and nothing in between', () => {
    assert.deepEqual(currentFestival('2026-11-08'), {festival: 'diwali', endsOn: '2026-11-11'});
    assert.deepEqual(currentFestival('2026-11-12'), {festival: null, endsOn: null});
  });

  it('lets staff switch a theme on or off without a release', () => {
    assert.deepEqual(currentFestival('2026-11-08', 'none'), {festival: null, endsOn: null});
    assert.deepEqual(currentFestival('2026-07-01', 'holi'), {festival: 'holi', endsOn: '2026-07-02'});
    assert.equal(currentFestival('2026-11-08', 'not-a-festival').festival, 'diwali');
  });

  it('never has two festivals on one day', () => {
    const sorted = [...FESTIVAL_DATES].sort((a: any, b: any) => a.from.localeCompare(b.from));
    sorted.slice(1).forEach((f: any, i: number) => assert.ok(sorted[i].to < f.from, `${sorted[i].id} overlaps ${f.id}`));
  });

  it('turns over at midnight in India, not in UTC', () => {
    assert.equal(todayInIndia(new Date('2026-11-04T19:00:00Z')), '2026-11-05');
  });

  it('answers without signing in', async () => {
    const res = await call('GET', '/festive');
    assert.equal(res.status, 200);
    assert.ok('festival' in res.body);
  });
});
