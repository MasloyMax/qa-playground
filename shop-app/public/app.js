const $ = (selector, root = document) => root.querySelector(selector);
const money = value => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const icon = name => '<svg aria-hidden="true"><use href="#' + escapeHtml(name) + '"/></svg>';
const state = { user: null, cart: null, page: 1, catalogRequest: 0, routeRequest: 0, pendingAdd: null, orderKey: null, lastOrder: null };
let toastTimer;
let searchTimer;

async function api(url, options = {}) {
  let response;
  try {
    response = await fetch('/api' + url, {
      credentials: 'same-origin', ...options,
      headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers }
    });
  } catch {
    throw new Error('Не удалось связаться с магазином. Проверьте, запущено ли приложение.');
  }
  if (response.status === 204) return null;
  const body = await response.json();
  if (!response.ok) {
    const error = Object.assign(new Error(body.message), { status: response.status, fields: body.fields || {} });
    if (response.status === 401 && body.code === 'UNAUTHORIZED') {
      state.user = null; state.cart = null; updateHeader();
    }
    throw error;
  }
  return body;
}
const post = (url, body) => api(url, { method: 'POST', body: JSON.stringify(body) });

function toast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 4000);
}
function pageError(error) {
  $('#page-error').textContent = error.message;
  $('#page-error').hidden = false;
}
function updateHeader() {
  $('#login-button').hidden = Boolean(state.user);
  $('#logout-button').hidden = !state.user;
  $('#user-name').hidden = !state.user;
  $('#user-name').textContent = state.user?.name || '';
  $('#cart-count').textContent = state.cart?.count || 0;
}
function openLogin(productId = null) {
  state.pendingAdd = productId;
  $('#product-dialog').close();
  $('#login-error').textContent = '';
  if (!$('#login-dialog').open) $('#login-dialog').showModal();
}
function empty(title, description, action = '<a class="button dark" href="#catalog">Перейти в каталог →</a>') {
  return '<div class="empty-state" data-testid="empty-state"><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(description) + '</p>' + action + '</div>';
}
function loginNeeded() {
  return empty('Давайте познакомимся', 'Войдите в аккаунт, чтобы продолжить.',
    '<button class="button dark" data-login data-testid="sign-in-required">Войти в аккаунт →</button>');
}
async function refreshCart() {
  state.cart = await api('/cart');
  updateHeader();
  return state.cart;
}

function card(product) {
  return '<article class="product-card" data-testid="product-card" data-product-id="' + product.id + '">' +
    '<a href="#product-' + product.id + '" data-product="' + product.id + '" class="product-image ' + product.color + '" aria-label="' + escapeHtml(product.name) + '">' +
    '<span class="stock-label">' + (product.stock ? 'В наличии' : 'Скоро вернётся') + '</span>' + icon(product.icon) + '</a>' +
    '<div class="product-info"><p class="product-category">' + escapeHtml(product.categoryName) + '</p>' +
    '<h3><a href="#product-' + product.id + '" data-product="' + product.id + '" data-testid="product-name">' + escapeHtml(product.name) + '</a></h3>' +
    '<div class="product-bottom"><span class="price" data-testid="product-price" data-price="' + product.price + '">' + money(product.price) + '</span>' +
    '<button class="add-button" data-add="' + product.id + '" data-testid="add-to-cart" ' + (product.stock ? '' : 'disabled') + '>' +
    (product.stock ? 'В корзину <span aria-hidden="true">+</span>' : 'Нет в наличии') + '</button></div></div></article>';
}

async function loadProducts() {
  const request = ++state.catalogRequest;
  const grid = $('#product-grid');
  grid.setAttribute('aria-busy', 'true');
  $('#prev-page').disabled = true;
  $('#next-page').disabled = true;
  const query = new URLSearchParams({
    search: $('#search').value, category: $('#category').value, sort: $('#sort').value,
    inStock: String($('#in-stock').checked), page: String(state.page), size: '6'
  });
  try {
    const result = await api('/products?' + query);
    if (request !== state.catalogRequest) return;
    grid.innerHTML = result.items.length ? result.items.map(card).join('') : empty('Ничего не нашлось', 'Попробуйте другое название или измените фильтры.', '');
    $('#products-count').textContent = 'Найдено товаров: ' + result.total;
    const pages = Math.max(1, Math.ceil(result.total / result.size));
    $('#page-number').textContent = result.page + ' / ' + pages;
    $('#prev-page').disabled = state.page <= 1;
    $('#next-page').disabled = state.page >= pages;
  } catch (error) {
    if (request === state.catalogRequest) {
      grid.innerHTML = empty('Не удалось загрузить каталог', error.message, '');
      $('#products-count').textContent = 'Ошибка загрузки';
    }
  } finally {
    if (request === state.catalogRequest) grid.setAttribute('aria-busy', 'false');
  }
}

async function showProduct(id) {
  const p = await api('/products/' + id);
  $('#product-detail').innerHTML = '<div class="product-image ' + p.color + '">' + icon(p.icon) + '</div>' +
    '<p class="product-category">' + escapeHtml(p.categoryName) + '</p><h2 id="product-title">' + escapeHtml(p.name) + '</h2>' +
    '<p class="muted">' + escapeHtml(p.description) + '</p><p data-testid="product-stock">В наличии: ' + p.stock + '</p>' +
    '<div class="product-bottom"><span class="price">' + money(p.price) + '</span><button class="button dark" data-add="' + p.id +
    '" data-testid="detail-add-to-cart" ' + (p.stock ? '' : 'disabled') + '>В корзину +</button></div>';
  $('#product-dialog').showModal();
}

async function addToCart(id) {
  if (!state.user) { openLogin(id); return; }
  state.cart = await post('/cart/items', { productId: Number(id), quantity: 1 });
  updateHeader();
  $('#product-dialog').close();
  toast('Товар добавлен в корзину');
}

function summary(cart, coupon = false) {
  return '<h2>Ваш заказ</h2><div class="summary-row"><span>Товары (' + cart.count + ')</span><span data-testid="subtotal">' + money(cart.subtotal) + '</span></div>' +
    '<div class="summary-row discount"><span>Скидка' + (cart.coupon ? ' · 10%' : '') + '</span><span data-testid="discount">−' + money(cart.discount) + '</span></div>' +
    '<div class="summary-row"><span>Доставка</span><span data-testid="shipping">' + (cart.shipping ? money(cart.shipping) : 'Бесплатно') + '</span></div>' +
    (coupon ? '<form class="coupon-form" id="coupon-form" novalidate><label for="coupon">Промокод</label><div><input id="coupon" name="code" data-testid="coupon" placeholder="Введите промокод" value="' + escapeHtml(cart.coupon || '') + '"><button class="button secondary" data-testid="apply-coupon">Применить</button></div><p id="coupon-error" class="form-error" role="alert" data-testid="coupon-error"></p></form>' +
      (cart.coupon ? '<button class="text-button subtle" data-remove-coupon data-testid="remove-coupon">Убрать промокод ×</button>' : '') : '') +
    '<div class="summary-row total"><b>Итого</b><b data-testid="total">' + money(cart.total) + '</b></div>';
}

function renderCart() {
  const cart = state.cart;
  if (!cart.items.length) { $('#cart-content').innerHTML = empty('Пока ничего нет', 'Кажется, ваша любимая вещь ещё в каталоге.'); return; }
  const items = cart.items.map(({ product: p, quantity, lineTotal }) =>
    '<article class="cart-item" data-testid="cart-item" data-product-id="' + p.id + '"><div class="cart-thumb ' + p.color + '">' + icon(p.icon) + '</div>' +
    '<div class="cart-description"><h3>' + escapeHtml(p.name) + '</h3><p>' + money(p.price) + ' / шт.</p><button class="remove-button" data-remove="' + p.id + '" data-testid="remove-item">Удалить</button></div>' +
    '<div class="quantity"><button data-quantity="' + p.id + '" data-value="' + (quantity - 1) + '" aria-label="Уменьшить количество" data-testid="decrease" ' + (quantity === 1 ? 'disabled' : '') + '>−</button>' +
    '<span data-testid="quantity">' + quantity + '</span><button data-quantity="' + p.id + '" data-value="' + (quantity + 1) + '" aria-label="Увеличить количество" data-testid="increase" ' + (quantity >= p.stock ? 'disabled' : '') + '>+</button></div>' +
    '<b class="price" data-testid="line-total">' + money(lineTotal) + '</b></article>').join('');
  $('#cart-content').innerHTML = '<div class="cart-layout"><div class="panel">' + items + '</div><aside class="panel summary">' +
    summary(cart, true) + '<a class="button dark wide" href="#checkout" data-testid="checkout-link">Оформить заказ →</a>' +
    '<p class="form-note">Бесплатная доставка от 5 000 ₽ после скидки.</p></aside></div>';
}

function renderOrders(orders) {
  $('#orders-content').innerHTML = orders.length ? orders.map(order =>
    '<article class="panel order-card" data-testid="order-card" data-order-id="' + order.id + '"><div class="order-header"><div><h2>Заказ № ' +
    escapeHtml(order.id.slice(0, 8)) + '</h2><p>' + new Date(order.createdAt).toLocaleString('ru-RU') + '</p></div><span class="status-badge">Оформлен</span></div>' +
    '<div class="order-lines">' + order.items.map(item => '<div>' + escapeHtml(item.product.name) + ' × ' + item.quantity + ' · ' + money(item.lineTotal) + '</div>').join('') +
    '</div><div class="order-footer"><span>' + escapeHtml(order.customer.address) + '</span><b>' + money(order.total) + '</b></div></article>').join('') :
    empty('История только начинается', 'Здесь появится ваш первый заказ.');
}

function renderSuccess(order) {
  $('#success-content').innerHTML = '<div class="panel success"><div class="success-mark" aria-hidden="true">✓</div><p class="eyebrow muted">Спасибо за ваш выбор</p>' +
    '<h1 data-testid="order-success">Заказ оформлен!</h1><p>Номер заказа: <b data-testid="order-id">' + escapeHtml(order.id) + '</b><br>' +
    'Доставим по адресу: ' + escapeHtml(order.customer.address) + '</p><p>Итого: <b>' + money(order.total) + '</b></p>' +
    '<div class="success-actions"><a class="button dark" href="#orders">Мои заказы →</a><a class="button secondary" href="#catalog">Вернуться в каталог</a></div></div>';
}

async function navigate() {
  const request = ++state.routeRequest;
  const hash = location.hash.slice(1);
  const view = ['cart', 'checkout', 'orders', 'success'].includes(hash) ? hash : 'catalog';
  $('.view:not([hidden])')?.setAttribute('hidden', '');
  $('#' + view + '-view').hidden = false;
  $('#page-error').hidden = true;
  document.querySelectorAll('[data-nav]').forEach(link => {
    if (link.dataset.nav === view) link.setAttribute('aria-current', 'page'); else link.removeAttribute('aria-current');
  });
  if (view === 'catalog') { await loadProducts(); return; }
  if (!state.user) {
    if (view === 'cart') $('#cart-content').innerHTML = loginNeeded();
    if (view === 'orders') $('#orders-content').innerHTML = loginNeeded();
    if (['checkout', 'success'].includes(view)) { location.hash = 'cart'; }
    return;
  }
  try {
    if (view === 'cart' || view === 'checkout') {
      await refreshCart();
      if (request !== state.routeRequest) return;
      if (view === 'cart') renderCart();
      else if (!state.cart.items.length) location.hash = 'cart';
      else {
        $('#checkout-summary').innerHTML = summary(state.cart);
        $('#checkout-form').elements.email.value ||= state.user.email;
      }
    } else if (view === 'orders') {
      const orders = await api('/orders');
      if (request === state.routeRequest) renderOrders(orders.items);
    } else if (view === 'success') {
      if (state.lastOrder) renderSuccess(state.lastOrder); else location.hash = 'orders';
    }
  } catch (error) {
    if (request === state.routeRequest) pageError(error);
  }
}

$('#login-button').addEventListener('click', () => openLogin());
$('#logout-button').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try {
    await api('/auth/logout', { method: 'POST' });
    state.user = null; state.cart = null; state.lastOrder = null; state.orderKey = null;
    $('#checkout-form').reset();
    $('#login-form').reset();
    updateHeader();
    location.hash = 'catalog';
    await navigate();
    toast('Вы вышли из аккаунта');
  } catch (error) { toast(error.message); }
  finally { button.disabled = false; }
});
$('#login-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $('[type="submit"]', form);
  if (button.disabled) return;
  button.disabled = true;
  $('#login-error').textContent = '';
  try {
    state.user = await post('/auth/login', Object.fromEntries(new FormData(form)));
    await refreshCart();
    $('#login-dialog').close();
    form.reset();
    const pending = state.pendingAdd;
    state.pendingAdd = null;
    state.lastOrder = null; state.orderKey = null;
    if (pending) await addToCart(pending);
    updateHeader();
    await navigate();
  } catch (error) { $('#login-error').textContent = error.message; }
  finally { button.disabled = false; }
});

$('#filters').addEventListener('submit', event => { event.preventDefault(); clearTimeout(searchTimer); state.page = 1; loadProducts(); });
$('#search').addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => { state.page = 1; loadProducts(); }, 250);
});
for (const selector of ['#category', '#sort', '#in-stock']) {
  $(selector).addEventListener('change', () => { clearTimeout(searchTimer); state.page = 1; loadProducts(); });
}
$('#reset-filters').addEventListener('click', () => {
  clearTimeout(searchTimer); $('#filters').reset(); state.page = 1; loadProducts();
});
$('#prev-page').addEventListener('click', () => { state.page--; loadProducts(); });
$('#next-page').addEventListener('click', () => { state.page++; loadProducts(); });

document.addEventListener('click', async event => {
  const target = event.target.closest('[data-close],[data-product],[data-add],[data-remove],[data-quantity],[data-remove-coupon],[data-login]');
  if (!target || target.disabled) return;
  event.preventDefault();
  if (target.hasAttribute('data-close')) { $('#' + target.dataset.close).close(); return; }
  if (target.hasAttribute('data-login')) { openLogin(); return; }
  target.disabled = true;
  try {
    if (target.hasAttribute('data-product')) await showProduct(target.dataset.product);
    if (target.hasAttribute('data-add')) await addToCart(target.dataset.add);
    if (target.hasAttribute('data-remove')) {
      state.cart = await api('/cart/items/' + target.dataset.remove, { method: 'DELETE' });
      updateHeader(); renderCart();
    }
    if (target.hasAttribute('data-quantity')) {
      state.cart = await api('/cart/items/' + target.dataset.quantity, { method: 'PATCH', body: JSON.stringify({ quantity: Number(target.dataset.value) }) });
      updateHeader(); renderCart();
    }
    if (target.hasAttribute('data-remove-coupon')) {
      state.cart = await api('/cart/coupon', { method: 'DELETE' });
      renderCart();
    }
  } catch (error) { toast(error.message); }
  finally { target.disabled = false; }
});

document.addEventListener('submit', async event => {
  if (event.target.id !== 'coupon-form') return;
  event.preventDefault();
  const button = $('button', event.target);
  if (button.disabled) return;
  button.disabled = true;
  try {
    state.cart = await post('/cart/coupon', { code: $('#coupon').value });
    renderCart();
  } catch (error) { $('#coupon-error').textContent = error.message; }
  finally { button.disabled = false; }
});

$('#checkout-form').addEventListener('input', () => { state.orderKey = null; });
$('#checkout-form').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $('[type="submit"]', form);
  if (button.disabled) return;
  button.disabled = true;
  $('#checkout-error').textContent = '';
  form.querySelectorAll('[data-error]').forEach(node => { node.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach(node => node.removeAttribute('aria-invalid'));
  state.orderKey ||= crypto.randomUUID();
  try {
    state.lastOrder = await api('/orders', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
      headers: { 'Idempotency-Key': state.orderKey }
    });
    state.orderKey = null;
    state.cart = null;
    updateHeader();
    form.reset();
    location.hash = 'success';
  } catch (error) {
    if (error.status && error.status < 500) state.orderKey = null;
    $('#checkout-error').textContent = error.message;
    for (const [field, message] of Object.entries(error.fields || {})) {
      const node = $('[data-error="' + field + '"]', form);
      if (node) { node.textContent = message; form.elements[field].setAttribute('aria-invalid', 'true'); }
    }
  } finally { button.disabled = false; }
});

window.addEventListener('hashchange', () => { navigate().catch(pageError); });
try {
  state.user = await api('/me');
  await refreshCart();
} catch (error) {
  if (error.status !== 401) pageError(error);
}
updateHeader();
await navigate();
