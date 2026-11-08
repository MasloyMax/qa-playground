import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server.js';

let server;
let baseUrl;

before(async () => {
  server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = 'http://127.0.0.1:' + server.address().port;
});
after(async () => {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

async function request(route, { method = 'GET', cookie, body, headers = {} } = {}) {
  const response = await fetch(baseUrl + route, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = response.status === 204 ? null : await response.json();
  return { status: response.status, data, cookie: response.headers.get('set-cookie')?.split(';')[0] };
}
async function login() {
  const result = await request('/api/auth/login', { method: 'POST', body: { email: 'demo@practice.dev', password: 'practice123' } });
  assert.equal(result.status, 200);
  return result.cookie;
}
const customer = { name: 'Анна', email: 'anna@example.com', phone: '+79991234567', address: 'Москва, улица Лесная, дом 10' };
const add = (cookie, productId = 1, quantity = 1) => request('/api/cart/items', { method: 'POST', cookie, body: { productId, quantity } });

test('catalog filters, sorts and paginates without changing its source', async () => {
  const first = await request('/api/products?category=audio&sort=price_asc&size=1');
  assert.equal(first.status, 200);
  assert.equal(first.data.total, 2);
  assert.equal(first.data.items[0].id, 4);
  const second = await request('/api/products?category=audio&sort=price_asc&size=1&page=2');
  assert.equal(second.data.items[0].id, 1);
  assert.equal((await request('/api/products?size=100')).data.items.length, 8);
});
test('search is case insensitive; unavailable products can be excluded', async () => {
  const search = await request('/api/products?search=' + encodeURIComponent('НАУШНИКИ'));
  assert.equal(search.data.items[0].id, 1);
  assert.equal((await request('/api/products?inStock=true&size=100')).data.total, 7);
  assert.equal((await request('/api/products?search=unknown')).data.total, 0);
});
test('invalid catalog parameters return 400', async () => {
  for (const query of ['page=0', 'page=-1', 'page=x', 'page=1.2', 'size=101', 'category=unknown', 'sort=unknown', 'inStock=yes']) {
    assert.equal((await request('/api/products?' + query)).status, 400, query);
  }
});
test('invalid credentials and locked account are distinguished', async () => {
  assert.equal((await request('/api/auth/login', { method: 'POST', body: { email: 'demo@practice.dev', password: 'wrong' } })).status, 401);
  const locked = await request('/api/auth/login', { method: 'POST', body: { email: 'locked@practice.dev', password: 'practice123' } });
  assert.equal(locked.status, 403);
  assert.equal(locked.data.code, 'USER_LOCKED');
});
test('private endpoints require a session', async () => {
  for (const route of ['/api/me', '/api/cart', '/api/orders']) {
    assert.equal((await request(route)).status, 401);
  }
});
test('two logins have independent carts even for the same user', async () => {
  const first = await login();
  const second = await login();
  await add(first);
  assert.equal((await request('/api/cart', { cookie: first })).data.count, 1);
  assert.equal((await request('/api/cart', { cookie: second })).data.count, 0);
});
test('repeated additions accumulate, and exceeding stock does not mutate the cart', async () => {
  const cookie = await login();
  await add(cookie, 1, 3);
  assert.equal((await add(cookie, 1, 4)).data.count, 7);
  assert.equal((await add(cookie, 1, 2)).status, 409);
  assert.equal((await request('/api/cart', { cookie })).data.count, 7);
});
test('quantity validation rejects zero, fractions, strings and missing products', async () => {
  const cookie = await login();
  for (const quantity of [0, -1, 1.5, '2', null, 100]) {
    assert.equal((await add(cookie, 1, quantity)).status, 400);
  }
  assert.equal((await add(cookie, 999)).status, 404);
  assert.equal((await add(cookie, 8)).status, 409);
});
test('discount and delivery are calculated on the server', async () => {
  const cookie = await login();
  await add(cookie);
  let cart = await request('/api/cart/coupon', { method: 'POST', cookie, body: { code: ' practice10 ' } });
  assert.deepEqual([cart.data.subtotal, cart.data.discount, cart.data.shipping, cart.data.total], [4900, 490, 300, 4710]);
  cart = await request('/api/cart/items/1', { method: 'PATCH', cookie, body: { quantity: 2 } });
  assert.deepEqual([cart.data.discount, cart.data.shipping, cart.data.total], [980, 0, 8820]);
  assert.equal((await request('/api/cart/coupon', { method: 'POST', cookie, body: { code: 'unknown' } })).status, 400);
});
test('removing an item and clearing the cart recompute totals', async () => {
  const cookie = await login();
  await add(cookie);
  const removed = await request('/api/cart/items/1', { method: 'DELETE', cookie });
  assert.equal(removed.data.total, 0);
  assert.equal(removed.data.shipping, 0);
  assert.equal((await request('/api/cart/items/1', { method: 'DELETE', cookie })).status, 404);
  await add(cookie);
  await request('/api/cart/coupon', { method: 'POST', cookie, body: { code: 'PRACTICE10' } });
  const clear = await request('/api/cart', { method: 'DELETE', cookie });
  assert.equal(clear.data.coupon, null);
  assert.equal(clear.data.count, 0);
});
test('checkout validates fields without losing the cart', async () => {
  const cookie = await login();
  await add(cookie);
  const response = await request('/api/orders', { method: 'POST', cookie, body: { name: 'A', email: 'x', phone: '123', address: 'x' } });
  assert.equal(response.status, 400);
  assert.deepEqual(Object.keys(response.data.fields).sort(), ['address', 'email', 'name', 'phone']);
  assert.equal((await request('/api/cart', { cookie })).data.count, 1);
});
test('checkout snapshots totals, clears the cart and supports safe retry', async () => {
  const cookie = await login();
  await add(cookie);
  await request('/api/cart/coupon', { method: 'POST', cookie, body: { code: 'PRACTICE10' } });
  const options = { method: 'POST', cookie, body: customer, headers: { 'Idempotency-Key': 'order-test-1' } };
  const created = await request('/api/orders', options);
  assert.equal(created.status, 201);
  assert.equal(created.data.total, 4710);
  assert.equal(created.data.customer.address, customer.address);
  const repeated = await request('/api/orders', options);
  assert.equal(repeated.status, 200);
  assert.equal(repeated.data.id, created.data.id);
  assert.equal((await request('/api/orders', { cookie })).data.items.length, 1);
  assert.equal((await request('/api/cart', { cookie })).data.count, 0);
  const conflict = await request('/api/orders', { ...options, body: { ...customer, name: 'Мария' } });
  assert.equal(conflict.status, 409);
  assert.equal((await request('/api/orders', { method: 'POST', cookie, body: customer })).data.code, 'EMPTY_CART');
});
test('orders are inaccessible from another session', async () => {
  const cookie = await login();
  await add(cookie);
  const order = await request('/api/orders', { method: 'POST', cookie, body: customer });
  assert.equal((await request('/api/orders/' + order.data.id, { cookie })).status, 200);
  const stranger = await login();
  assert.equal((await request('/api/orders/' + order.data.id, { cookie: stranger })).status, 404);
});
test('logout invalidates the old session cookie', async () => {
  const cookie = await login();
  assert.equal((await request('/api/auth/logout', { method: 'POST', cookie })).status, 204);
  assert.equal((await request('/api/me', { cookie })).status, 401);
});
test('malformed requests have controlled errors', async () => {
  const response = await fetch(baseUrl + '/api/auth/login', { method: 'POST', body: '{', headers: { 'Content-Type': 'application/json' } });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).code, 'INVALID_JSON');
  const plain = await fetch(baseUrl + '/api/auth/login', { method: 'POST', body: '{}' });
  assert.equal(plain.status, 415);
  await plain.text();
  assert.equal((await request('/api/auth/login', { method: 'POST', body: [] })).status, 400);
  const big = await request('/api/auth/login', { method: 'POST', body: { text: 'a'.repeat(17000) } });
  assert.equal(big.status, 413);
});
test('unknown routes and cross-origin mutations are rejected', async () => {
  assert.equal((await request('/api/missing')).status, 404);
  const blocked = await request('/api/auth/login', { method: 'POST', body: {}, headers: { Origin: 'http://example.com' } });
  assert.equal(blocked.status, 403);
  const cookie = await login();
  assert.equal((await request('/api/cart', { method: 'PUT', cookie, body: {} })).status, 405);
});
test('the application serves HTML and assets, not arbitrary local files', async () => {
  for (const route of ['/', '/styles.css', '/app.js', '/favicon.svg']) {
    const response = await fetch(baseUrl + route);
    assert.equal(response.status, 200, route);
    await response.text();
  }
  assert.equal((await fetch(baseUrl + '/server.js')).status, 404);
  const head = await fetch(baseUrl + '/', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
