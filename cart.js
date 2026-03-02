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
const cartOpenBtn = document.getElementById('cartOpenBtn');

function renderCart() {
  const cart = getCart();
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    const emptyMsg = document.createElement('li');
    emptyMsg.className = 'cart-empty-msg';
    emptyMsg.textContent = 'Your cart is empty.';
    cartItemsEl.appendChild(emptyMsg);
  }

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
    controls.setAttribute('role', 'group');
    controls.setAttribute('aria-label', `Quantity for ${item.name}`);

    const decBtn = document.createElement('button');
    decBtn.className = 'cart-qty-btn';
    decBtn.type = 'button';
    decBtn.textContent = '−';
    decBtn.setAttribute('aria-label', `Decrease quantity of ${item.name}`);
    decBtn.disabled = item.qty <= 1;
    decBtn.addEventListener('click', () => updateQuantity(item.id, -1));

    const qtyEl = document.createElement('span');
    qtyEl.className = 'cart-item__qty';
    qtyEl.textContent = item.qty;
    qtyEl.setAttribute('aria-label', `Quantity: ${item.qty}`);

    const incBtn = document.createElement('button');
    incBtn.className = 'cart-qty-btn';
    incBtn.type = 'button';
    incBtn.textContent = '+';
    incBtn.setAttribute('aria-label', `Increase quantity of ${item.name}`);
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

  // Keep the cart open button label in sync so screen readers hear the count
  if (totalQty === 0) {
    cartOpenBtn.setAttribute('aria-label', 'Open cart');
  } else {
    cartOpenBtn.setAttribute('aria-label', `Open cart, ${totalQty} item${totalQty !== 1 ? 's' : ''}`);
  }
}

// Drawer open/close
const cartDrawer  = document.getElementById('cartDrawer');
const cartOverlay = document.getElementById('cartOverlay');

function openCart() {
  cartDrawer.classList.add('is-open');
  cartOverlay.classList.add('is-open');
  cartDrawer.removeAttribute('inert');
  cartOpenBtn.setAttribute('aria-expanded', 'true');
  // Move focus to the close button so keyboard/AT users are immediately inside the dialog
  document.getElementById('cartCloseBtn').focus();
}

function closeCart() {
  cartDrawer.classList.remove('is-open');
  cartOverlay.classList.remove('is-open');
  cartDrawer.setAttribute('inert', '');
  cartOpenBtn.setAttribute('aria-expanded', 'false');
  // Return focus to the element that opened the drawer
  cartOpenBtn.focus();
}

cartOpenBtn.addEventListener('click', openCart);
document.getElementById('cartCloseBtn').addEventListener('click', closeCart);
cartOverlay.addEventListener('click', closeCart);

// Keyboard: Escape closes; Tab is trapped inside the open drawer
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && cartDrawer.classList.contains('is-open')) {
    closeCart();
    return;
  }

  if (e.key === 'Tab' && cartDrawer.classList.contains('is-open')) {
    const focusable = [
      ...cartDrawer.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])')
    ];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
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
