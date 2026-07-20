/**
 * Winkelwagen — localStorage-gebaseerd, Odoo-gereed.
 */
const Cart = (() => {
  const KEY = 'sb_cart';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    _dispatch();
  }

  function _dispatch() {
    document.dispatchEvent(new CustomEvent('cart:update', { detail: getAll() }));
  }

  function getAll() { return load(); }

  function count() { return load().reduce((s, i) => s + i.qty, 0); }

  function total() {
    return load().reduce((s, i) => s + i.price * i.qty, 0);
  }

  function add(item) {
    // item = { id, name, price, image, emoji }
    const items = load();
    const idx = items.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      items[idx].qty += 1;
    } else {
      items.push({ ...item, qty: 1 });
    }
    save(items);
  }

  function remove(id) {
    save(load().filter(i => i.id !== id));
  }

  function setQty(id, qty) {
    if (qty < 1) { remove(id); return; }
    const items = load();
    const idx = items.findIndex(i => i.id === id);
    if (idx >= 0) { items[idx].qty = qty; save(items); }
  }

  function clear() { save([]); }

  function toOdooLines() {
    return load().map(i => ({
      productId: i.id,
      qty: i.qty,
      price: i.price,
      name: i.name,
    }));
  }

  return { getAll, count, total, add, remove, setQty, clear, toOdooLines };
})();


/**
 * Cart UI — drawer en counter bijwerken.
 */
const CartUI = (() => {
  const fmt = n => `€ ${n.toFixed(2).replace('.', ',')}`;

  function init() {
    document.addEventListener('cart:update', render);
    render();
  }

  function render() {
    updateCounter();
    renderItems();
    renderTotals();
  }

  function updateCounter() {
    const n = Cart.count();
    document.querySelectorAll('.nav__cart-count').forEach(el => {
      el.textContent = n;
      el.classList.toggle('visible', n > 0);
    });
  }

  function renderItems() {
    const container = document.getElementById('cart-items');
    if (!container) return;
    const items = Cart.getAll();
    if (items.length === 0) {
      container.innerHTML = `
        <div class="cart-empty">
          <div class="cart-empty__icon">☕</div>
          <p>Je winkelwagen is leeg</p>
          <a href="shop.html" class="btn btn--primary btn--sm" style="margin-top:1rem">Naar de shop</a>
        </div>`;
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <div class="cart-item__img">${item.image ? `<img src="${item.image}" alt="${item.name}">` : item.emoji || '☕'}</div>
        <div class="cart-item__info">
          <div class="cart-item__name">${item.name}</div>
          <div class="cart-item__price">${fmt(item.price)}</div>
          <div class="cart-item__qty">
            <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
          </div>
          <button class="cart-item__remove" data-remove="${item.id}">Verwijderen</button>
        </div>
      </div>`).join('');

    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = +btn.dataset.id;
        const item = Cart.getAll().find(i => i.id === id);
        if (!item) return;
        Cart.setQty(id, item.qty + (btn.dataset.action === 'inc' ? 1 : -1));
      });
    });
    container.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', () => Cart.remove(+btn.dataset.remove));
    });
  }

  function renderTotals() {
    document.querySelectorAll('[data-cart-total]').forEach(el => {
      el.textContent = `€ ${Cart.total().toFixed(2).replace('.', ',')}`;
    });
    document.querySelectorAll('[data-cart-count]').forEach(el => {
      el.textContent = Cart.count();
    });
  }

  return { init, render };
})();

document.addEventListener('DOMContentLoaded', CartUI.init);
