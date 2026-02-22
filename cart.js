const CART_KEY = 'saltyPawsCart';

function getCart() {
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // Storage full or unavailable (e.g. private browsing)
  }
}

function addItem(id, name, price) {
  const cart = getCart();
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price: parseFloat(price), qty: 1 });
  }
  saveCart(cart);
}

function updateQuantity(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) item.qty = 1;
  saveCart(cart);
  renderCart();
}

function removeItem(id) {
  const cart = getCart().filter(i => i.id !== id);
  saveCart(cart);
  renderCart();
}

// Render cart items into the drawer
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartBadgeEl = document.getElementById('cartBadge');

function renderCart() {
  const cart = getCart();
  cartItemsEl.innerHTML = '';

  cart.forEach(item => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.dataset.id = item.id;

    // Top row: name + line total
    const info = document.createElement('div');
    info.className = 'cart-item__info';

    const nameEl = document.createElement('span');
    nameEl.className = 'cart-item__name';
    nameEl.textContent = item.name;

    const priceEl = document.createElement('span');
    priceEl.className = 'cart-item__price';
    priceEl.textContent = `$${(item.price * item.qty).toFixed(2)}`;

    info.appendChild(nameEl);
    info.appendChild(priceEl);

    // Bottom row: qty controls + remove
    const controls = document.createElement('div');
    controls.className = 'cart-item__controls';

    const decBtn = document.createElement('button');
    decBtn.className = 'cart-qty-btn';
    decBtn.type = 'button';
    decBtn.textContent = '−';
    decBtn.setAttribute('aria-label', 'Decrease quantity');
    decBtn.disabled = item.qty <= 1;
    decBtn.addEventListener('click', () => updateQuantity(item.id, -1));

    const qtyEl = document.createElement('span');
    qtyEl.className = 'cart-item__qty';
    qtyEl.textContent = item.qty;

    const incBtn = document.createElement('button');
    incBtn.className = 'cart-qty-btn';
    incBtn.type = 'button';
    incBtn.textContent = '+';
    incBtn.setAttribute('aria-label', 'Increase quantity');
    incBtn.addEventListener('click', () => updateQuantity(item.id, 1));

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-remove-btn';
    removeBtn.type = 'button';
    removeBtn.textContent = 'Remove';
    removeBtn.setAttribute('aria-label', `Remove ${item.name} from cart`);
    removeBtn.addEventListener('click', () => removeItem(item.id));

    controls.appendChild(decBtn);
    controls.appendChild(qtyEl);
    controls.appendChild(incBtn);
    controls.appendChild(removeBtn);

    li.appendChild(info);
    li.appendChild(controls);
    cartItemsEl.appendChild(li);
  });

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  cartTotalEl.textContent = `$${total.toFixed(2)}`;

  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  cartBadgeEl.textContent = totalQty;
  cartBadgeEl.hidden = totalQty === 0;
}

// Drawer open/close
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');

function openCart() {
  cartDrawer.classList.add('is-open');
  cartOverlay.classList.add('is-open');
  cartDrawer.removeAttribute('inert');
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartOverlay.classList.remove('is-open');
  cartDrawer.setAttribute('inert', '');
}

document.getElementById('cartOpenBtn').addEventListener('click', openCart);
document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Close on Escape key
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});

// Wire up "Add to Cart" buttons
document.querySelectorAll('.merch-card').forEach(card => {
  card.querySelector('.btn-add-to-cart')?.addEventListener('click', () => {
    const { id, name, price } = card.dataset;
    addItem(id, name, price);
    renderCart();
  });
});

// Render on page load so persisted cart shows up immediately
renderCart();
