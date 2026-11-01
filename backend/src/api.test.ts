import {after, before, describe, it} from 'node:test';
import assert from 'node:assert/strict';
import {AddressInfo} from 'node:net';
import {Server} from 'node:http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

process.env.JWT_SECRET = 'test-secret-test-secret-test-secret-1234';
process.env.AUTH_RATE_LIMIT = '1000';
process.env.API_RATE_LIMIT = '100000';

const url = process.env.DATABASE_URL || '';
if (!/@(localhost|127\.0\.0\.1)(:\d+)?\/.*test/.test(url)) {
  throw new Error('Tests delete data: DATABASE_URL must be a local database with "test" in its name.');
}

// Imported after the env is set, because the rate limiters read it on load
const app = require('./app').default;
const prisma = require('./prisma').default;

let server: Server;
let base: string;

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

  it('upgrades an old plain-text password on login', async () => {
    const old = await prisma.user.create({data: {name: 'Old', email: 'old@test.com', password: 'plain-text-pass'}});
    const res = await call('POST', '/auth/login', {body: {email: 'old@test.com', password: 'plain-text-pass'}});
    assert.equal(res.status, 200);
    const updated = await prisma.user.findUnique({where: {id: old.id}});
    assert.ok(updated.password.startsWith('$2'));
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

describe('account deletion', () => {
  it('needs the correct password', async () => {
    const res = await call('DELETE', '/auth/me', {token: bob.token, body: {password: 'wrong'}});
    assert.equal(res.status, 403);
    assert.ok(await prisma.user.findUnique({where: {id: bob.id}}));
  });

  it('removes the user and their data', async () => {
    await call('POST', '/bookings', {token: bob.token, body: {propertyId, date: '2026-12-01', time: '10:00'}});
    const created = await call('POST', '/rentals', {token: bob.token, body: {address: 'x', unitNo: '1', city: 'x', rent: 1}});
    await call('POST', `/rentals/${created.body.id}/documents`, {token: bob.token, body: {type: 'poa', fileName: 'x.pdf'}});

    const res = await call('DELETE', '/auth/me', {token: bob.token, body: {password: PASSWORD}});
    assert.equal(res.status, 204);
    assert.equal(await prisma.user.findUnique({where: {id: bob.id}}), null);
    assert.equal(await prisma.booking.count({where: {userId: bob.id}}), 0);
    assert.equal(await prisma.favorite.count({where: {userId: bob.id}}), 0);
    assert.equal(await prisma.rental.count({where: {userId: bob.id}}), 0);
  });
});
