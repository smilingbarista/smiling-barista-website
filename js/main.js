/**
 * Smiling Barista — core UI
 */
document.addEventListener('DOMContentLoaded', () => {

  /* ── Scroll-aware nav ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Active nav link ── */
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link, .mobile-nav__link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });

  /* ── Mobile menu ── */
  const burger = document.querySelector('.nav__burger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileClose = document.querySelector('.mobile-nav__close');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => mobileNav.classList.add('open'));
    mobileClose?.addEventListener('click', () => mobileNav.classList.remove('open'));
    mobileNav.querySelectorAll('.mobile-nav__link').forEach(l =>
      l.addEventListener('click', () => mobileNav.classList.remove('open'))
    );
  }

  /* ── Cart drawer ── */
  const overlay  = document.querySelector('.cart-overlay');
  const drawer   = document.querySelector('.cart-drawer');
  const cartBtns = document.querySelectorAll('[data-open-cart]');
  const closeBtn = document.querySelector('.cart-drawer__close');

  function openCart()  { overlay?.classList.add('open'); drawer?.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeCart() { overlay?.classList.remove('open'); drawer?.classList.remove('open'); document.body.style.overflow = ''; }

  cartBtns.forEach(b => b.addEventListener('click', openCart));
  closeBtn?.addEventListener('click', closeCart);
  overlay?.addEventListener('click', closeCart);
  document.addEventListener('keydown', e => e.key === 'Escape' && closeCart());

  /* ── Checkout modal ── */
  const checkoutOverlay = document.querySelector('.modal-overlay');
  const checkoutModal   = document.querySelector('.modal');
  const openCheckout    = document.querySelector('[data-open-checkout]');
  const closeCheckout   = document.querySelector('[data-close-checkout]');

  openCheckout?.addEventListener('click', () => {
    if (Cart.count() === 0) { Toast.show('Je winkelwagen is leeg', 'error'); return; }
    closeCart();
    renderOrderSummary();
    checkoutOverlay?.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  function closeCheckoutFn() {
    checkoutOverlay?.classList.remove('open');
    document.body.style.overflow = '';
  }
  closeCheckout?.addEventListener('click', closeCheckoutFn);
  checkoutOverlay?.addEventListener('click', e => { if (e.target === checkoutOverlay) closeCheckoutFn(); });

  function renderOrderSummary() {
    const el = document.getElementById('order-summary');
    if (!el) return;
    const items = Cart.getAll();
    const fmt = n => `€ ${n.toFixed(2).replace('.', ',')}`;
    el.innerHTML = `
      <div class="order-summary">
        <div class="order-summary__title">Bestelling overzicht</div>
        ${items.map(i => `<div class="order-line"><span>${i.name} × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
        <div class="order-total"><span>Totaal</span><span>${fmt(Cart.total())}</span></div>
      </div>`;
  }

  /* ── Checkout form submit ── */
  const checkoutForm = document.getElementById('checkout-form');
  checkoutForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = checkoutForm.querySelector('[type=submit]');
    btn.disabled = true;
    btn.textContent = 'Verwerken…';

    const fd = new FormData(checkoutForm);
    try {
      await OdooAPI.authenticate();
      const orderId = await OdooAPI.createOrder({
        customerName:  fd.get('name'),
        customerEmail: fd.get('email'),
        customerPhone: fd.get('phone'),
        street:        fd.get('street'),
        zip:           fd.get('zip'),
        city:          fd.get('city'),
        lines:         Cart.toOdooLines(),
        note:          fd.get('note'),
      });
      Cart.clear();
      closeCheckoutFn();
      Toast.show(`Bestelling #${orderId} geplaatst! We nemen spoedig contact op.`, 'success');
    } catch (err) {
      console.error(err);
      Toast.show('Er ging iets mis. Probeer opnieuw of neem contact op.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Bestelling bevestigen';
    }
  });

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

});

/* ── Toast notifications ── */
const Toast = (() => {
  let wrap;
  function ensure() {
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; document.body.appendChild(wrap); }
  }
  function show(msg, type = '') {
    ensure();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  }
  return { show };
})();
