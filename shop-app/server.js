import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { products } from './catalog.js';

const publicDir = fileURLToPath(new URL('./public/', import.meta.url));
const sessionAge = 2 * 60 * 60 * 1000;
const cookieName = 'practice_session';
const categories = ['audio', 'workspace', 'home', 'travel'];

class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}
const fail = (status, code, message, fields) => { throw new ApiError(status, code, message, fields); };
const requireText = (value) => typeof value === 'string' ? value.trim() : '';

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function bodyOf(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) {
    fail(415, 'JSON_REQUIRED', 'Отправьте тело запроса в формате application/json.');
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) fail(413, 'BODY_TOO_LARGE', 'Слишком большой запрос.');
    chunks.push(chunk);
  }
  let body;
  try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { fail(400, 'INVALID_JSON', 'Некорректный JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    fail(400, 'INVALID_BODY', 'Ожидается JSON-объект.');
  }
  return body;
}

function cookieId(req) {
  return (req.headers.cookie || '').split(';').map(s => s.trim())
    .find(s => s.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
}

function productOf(id) {
  const product = products.find(p => p.id === Number(id));
  if (!product) fail(404, 'PRODUCT_NOT_FOUND', 'Товар не найден.');
  return product;
}

function quantityOf(value, stock) {
  if (!Number.isInteger(value) || value < 1 || value > 99) {
    fail(400, 'INVALID_QUANTITY', 'Количество должно быть целым числом от 1 до 99.');
  }
  if (value > stock) fail(409, 'OUT_OF_STOCK', 'Недостаточно товара в наличии.');
  return value;
}

function cartOf(session) {
  const items = [...session.cart].map(([id, quantity]) => {
    const product = productOf(id);
    return { product, quantity, lineTotal: product.price * quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discount = session.coupon ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal === 0 || subtotal - discount >= 5000 ? 0 : 300;
  return {
    items, count: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal, discount, shipping, total: subtotal - discount + shipping,
    coupon: session.coupon, currency: 'RUB'
  };
}

function listProducts(query) {
  const category = query.get('category') || '';
  const search = (query.get('search') || '').trim().toLocaleLowerCase('ru');
  const sort = query.get('sort') || 'name';
  if (category && !categories.includes(category)) fail(400, 'INVALID_CATEGORY', 'Неизвестная категория.');
  if (!['name', 'price_asc', 'price_desc'].includes(sort)) fail(400, 'INVALID_SORT', 'Неизвестная сортировка.');
  const parsePage = (name, fallback, max) => {
    const raw = query.get(name);
    if (raw === null) return fallback;
    if (!/^[1-9]\d*$/.test(raw) || Number(raw) > max) fail(400, 'INVALID_PAGE', 'Некорректный параметр ' + name + '.');
    return Number(raw);
  };
  const page = parsePage('page', 1, 10000);
  const size = parsePage('size', 6, 100);
  if (query.has('inStock') && !['true', 'false'].includes(query.get('inStock'))) {
    fail(400, 'INVALID_FILTER', 'inStock принимает true или false.');
  }
  const filtered = products.filter(p =>
    (!category || p.category === category) &&
    (!search || p.name.toLocaleLowerCase('ru').includes(search)) &&
    (query.get('inStock') !== 'true' || p.stock > 0));
  filtered.sort(sort === 'name'
    ? (a, b) => a.name.localeCompare(b.name, 'ru')
    : (a, b) => (sort === 'price_asc' ? a.price - b.price : b.price - a.price) || a.id - b.id);
  return { items: filtered.slice((page - 1) * size, page * size), total: filtered.length, page, size };
}

export function createApp() {
  const sessions = new Map();

  function sessionOf(req) {
    const id = cookieId(req);
    const session = sessions.get(id);
    if (!session || session.expires <= Date.now()) {
      sessions.delete(id);
      fail(401, 'UNAUTHORIZED', 'Сначала войдите в аккаунт.');
    }
    return session;
  }

  async function api(req, res, url) {
    const route = req.method + ' ' + url.pathname;
    if (!['GET', 'HEAD'].includes(req.method) && req.headers.origin) {
      let origin;
      try { origin = new URL(req.headers.origin); }
      catch { fail(403, 'INVALID_ORIGIN', 'Недопустимый источник запроса.'); }
      if (origin.host !== req.headers.host || origin.protocol !== 'http:') {
        fail(403, 'INVALID_ORIGIN', 'Недопустимый источник запроса.');
      }
    }
    if (route === 'GET /api/health') return json(res, 200, { status: 'UP', application: 'practice-market' });
    if (route === 'GET /api/products') return json(res, 200, listProducts(url.searchParams));
    if (req.method === 'GET' && /^\/api\/products\/\d+$/.test(url.pathname)) {
      return json(res, 200, productOf(url.pathname.split('/').pop()));
    }
    if (route === 'POST /api/auth/login') {
      const body = await bodyOf(req);
      const email = requireText(body.email).toLowerCase();
      if (!['demo@practice.dev', 'locked@practice.dev'].includes(email) || body.password !== 'practice123') {
        fail(401, 'INVALID_CREDENTIALS', 'Неверная почта или пароль.');
      }
      if (email === 'locked@practice.dev') fail(403, 'USER_LOCKED', 'Аккаунт заблокирован.');
      for (const [id, session] of sessions) if (session.expires <= Date.now()) sessions.delete(id);
      sessions.delete(cookieId(req));
      const id = randomUUID();
      const user = { id: 1, name: 'Алексей', email };
      sessions.set(id, { user, expires: Date.now() + sessionAge, cart: new Map(), coupon: null, orders: [], requests: new Map() });
      res.setHeader('Set-Cookie', cookieName + '=' + id + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=7200');
      return json(res, 200, user);
    }
    if (route === 'POST /api/auth/logout') {
      sessions.delete(cookieId(req));
      res.setHeader('Set-Cookie', cookieName + '=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0');
      res.writeHead(204); return res.end();
    }

    const knownRoute = ['/api/me', '/api/cart', '/api/cart/items', '/api/cart/coupon', '/api/orders'].includes(url.pathname)
      || /^\/api\/cart\/items\/\d+$/.test(url.pathname) || /^\/api\/orders\/[^/]+$/.test(url.pathname);
    if (!knownRoute) fail(404, 'NOT_FOUND', 'Маршрут не найден.');
    const session = sessionOf(req);
    if (route === 'GET /api/me') return json(res, 200, session.user);
    if (route === 'GET /api/cart') return json(res, 200, cartOf(session));
    if (route === 'DELETE /api/cart') {
      session.cart.clear(); session.coupon = null;
      return json(res, 200, cartOf(session));
    }
    if (route === 'POST /api/cart/items') {
      const body = await bodyOf(req);
      if (!Number.isInteger(body.productId)) fail(400, 'INVALID_PRODUCT_ID', 'productId должен быть целым числом.');
      const product = productOf(body.productId);
      const quantity = quantityOf(body.quantity, product.stock);
      const nextQuantity = quantityOf((session.cart.get(product.id) || 0) + quantity, product.stock);
      session.cart.set(product.id, nextQuantity);
      return json(res, 200, cartOf(session));
    }
    if (/^\/api\/cart\/items\/\d+$/.test(url.pathname) && ['PATCH', 'DELETE'].includes(req.method)) {
      const product = productOf(url.pathname.split('/').pop());
      if (!session.cart.has(product.id)) fail(404, 'CART_ITEM_NOT_FOUND', 'Товара нет в корзине.');
      if (req.method === 'DELETE') session.cart.delete(product.id);
      else session.cart.set(product.id, quantityOf((await bodyOf(req)).quantity, product.stock));
      return json(res, 200, cartOf(session));
    }
    if (route === 'POST /api/cart/coupon') {
      const code = requireText((await bodyOf(req)).code).toUpperCase();
      if (code !== 'PRACTICE10') fail(400, 'INVALID_COUPON', 'Промокод не найден.');
      if (!session.cart.size) fail(409, 'EMPTY_CART', 'Сначала добавьте товары в корзину.');
      session.coupon = code;
      return json(res, 200, cartOf(session));
    }
    if (route === 'DELETE /api/cart/coupon') {
      session.coupon = null;
      return json(res, 200, cartOf(session));
    }
    if (route === 'GET /api/orders') return json(res, 200, { items: session.orders });
    if (req.method === 'GET' && /^\/api\/orders\/[^/]+$/.test(url.pathname)) {
      const order = session.orders.find(o => o.id === url.pathname.split('/').pop());
      if (!order) fail(404, 'ORDER_NOT_FOUND', 'Заказ не найден.');
      return json(res, 200, order);
    }
    if (route === 'POST /api/orders') {
      const body = await bodyOf(req);
      const customer = {
        name: requireText(body.name), email: requireText(body.email),
        phone: requireText(body.phone), address: requireText(body.address)
      };
      const fields = {};
      if (customer.name.length < 2 || customer.name.length > 80) fields.name = 'Имя: от 2 до 80 символов.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) || customer.email.length > 120) fields.email = 'Укажите корректную почту.';
      if (!/^\+?\d{10,15}$/.test(customer.phone)) fields.phone = 'Телефон: от 10 до 15 цифр, можно начать с +.';
      if (customer.address.length < 10 || customer.address.length > 200) fields.address = 'Адрес: от 10 до 200 символов.';
      if (Object.keys(fields).length) fail(400, 'VALIDATION_ERROR', 'Проверьте данные доставки.', fields);
      const key = req.headers['idempotency-key'];
      if (key && !/^[a-zA-Z0-9_-]{1,100}$/.test(key)) fail(400, 'INVALID_KEY', 'Некорректный Idempotency-Key.');
      const fingerprint = JSON.stringify(customer);
      if (key && session.requests.has(key)) {
        const previous = session.requests.get(key);
        if (previous.fingerprint !== fingerprint) fail(409, 'KEY_CONFLICT', 'Этот ключ уже использован с другими данными.');
        return json(res, 200, previous.order);
      }
      if (!session.cart.size) fail(409, 'EMPTY_CART', 'Корзина пуста.');
      const order = { id: randomUUID(), status: 'CREATED', createdAt: new Date().toISOString(), customer, ...cartOf(session) };
      session.orders.unshift(order);
      if (key) session.requests.set(key, { fingerprint, order });
      session.cart.clear(); session.coupon = null;
      return json(res, 201, order);
    }
    fail(405, 'METHOD_NOT_ALLOWED', 'Метод не поддерживается для этого маршрута.');
  }

  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'");
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url);
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { code: 'METHOD_NOT_ALLOWED', message: 'Метод не поддерживается.' });
      const assets = {
        '/': ['index.html', 'text/html'],
        '/index.html': ['index.html', 'text/html'],
        '/app.js': ['app.js', 'text/javascript'],
        '/styles.css': ['styles.css', 'text/css'],
        '/favicon.svg': ['favicon.svg', 'image/svg+xml']
      };
      const asset = assets[url.pathname];
      if (!asset) return json(res, 404, { code: 'NOT_FOUND', message: 'Страница не найдена.' });
      const data = await readFile(path.join(publicDir, asset[0]));
      res.writeHead(200, { 'Content-Type': asset[1] + '; charset=utf-8', 'Cache-Control': 'no-cache' });
      res.end(req.method === 'HEAD' ? undefined : data);
    } catch (error) {
      if (error instanceof ApiError) return json(res, error.status, { code: error.code, message: error.message, fields: error.fields });
      console.error(error);
      json(res, 500, { code: 'INTERNAL_ERROR', message: 'Не удалось выполнить запрос.' });
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  const host = process.env.HOST || '127.0.0.1';
  const server = createApp();
  server.listen(port, host, () => console.log('Practice Market: http://' + host + ':' + port));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
