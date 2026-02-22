# Shopping Cart — Build Plan

Client-side shopping cart for the Salty Paws Cafe merch page.
Vanilla JS + `localStorage`. No frameworks, no build step.

---

## Steps

### Step 1 — Add data attributes and buttons to merch cards
**Files:** `merch.html`, `styles.css`

Each `.merch-card` receives three data attributes used by JS:
- `data-id` — kebab-case product slug (e.g. `classic-logo-tee`)
- `data-name` — display name
- `data-price` — numeric string (e.g. `28.00`)

Each `.merch-body` gets a `<button class="btn-add-to-cart" type="button">` after `.price`.
Button styled full-width, ocean blue, pill shape. No JS yet.

**Test:** Buttons visible and styled. Clicking does nothing.

---

### Step 2 — Create `cart.js` with localStorage helpers
**Files:** `cart.js` (new), `merch.html`

Functions:
- `getCart()` — reads `saltyPawsCart` from localStorage, returns parsed array (validated with `Array.isArray`), falls back to `[]` on error
- `saveCart(cart)` — serializes array to localStorage, silently handles `QuotaExceededError`
- `addItem(id, name, price)` — increments `qty` if item exists, otherwise pushes new entry with `parseFloat(price)`

Button click handler uses `card.closest` pattern via `card.dataset` + optional chaining on the button selector.
Script tag added before `</body>` in `merch.html`.

**Test:** Clicking buttons writes to `localStorage > saltyPawsCart`. Repeated clicks on same item increment `qty`.

---

### Step 3 — Cart drawer HTML, CSS, and open/close logic
**Files:** `merch.html`, `styles.css`, `cart.js`

HTML additions to `merch.html`:
- Cart icon button (`#cartOpenBtn`) in header, right of nav, with `#cartBadge` span (hidden by default)
- Semi-transparent overlay (`#cartOverlay`)
- `<aside id="cartDrawer" inert>` — slide-in panel with header, `<ul id="cartItems">`, and footer with `<span id="cartTotal">`

Drawer starts with `inert` attribute (removes from tab order + AT).
`openCart()` removes `inert`, `closeCart()` restores it.
Three close triggers: close button, overlay click, Escape key.
CSS: `translateX(100%)` → `translateX(0)` on `.is-open`. Overlay fades in.

**Test:** Cart icon opens drawer with slide animation. Close button, overlay click, and Escape all close it. Empty state ("Your cart is empty.") shown via CSS `:empty::after`.

---

### Step 4 — Render cart items in the drawer
**Files:** `cart.js`, `styles.css`

`renderCart()`:
- Clears `#cartItems` with `innerHTML = ''`
- Builds one `<li class="cart-item">` per entry using `createElement` / `textContent` (no `innerHTML` for user data — XSS prevention)
- Each item shows name (left) and line total `price × qty` (right)
- Updates `#cartTotal` with `reduce` sum
- Called on page load (so persisted cart restores immediately) and after every `addItem()`

**Test:** Add items, open drawer — each appears with correct name and price. Add same item twice — line total doubles. Reload — items persist.

---

### Step 5 — Quantity controls and remove button
**Files:** `cart.js`, `styles.css`

New functions:
- `updateQuantity(id, delta)` — finds item, adds delta, clamps to minimum 1, saves and re-renders
- `removeItem(id)` — filters item out, saves and re-renders

Each rendered cart item gets a controls row: `−` / qty display / `+` / Remove link.
`−` button is `disabled` when `item.qty <= 1` (browser blocks click; CSS adds `opacity: 0.35; cursor: not-allowed`).
All buttons use `textContent`, not `innerHTML`.

**Test:** `+` increments, `−` decrements (disabled at 1), Remove deletes. All changes persist on reload.

---

### Step 6 — Live badge and total
**Files:** `cart.js`

At the end of `renderCart()`:
- `totalQty = cart.reduce((sum, item) => sum + item.qty, 0)`
- `cartBadgeEl.textContent = totalQty`
- `cartBadgeEl.hidden = totalQty === 0`

Badge disappears when cart is empty; reappears on first add.
Total (`#cartTotal`) already updated in Step 4 — no additional change needed.

**Test:** Badge count matches total items across add/increment/decrement/remove. Persists on reload.

---

## Data shape (localStorage)

```json
[
  { "id": "classic-logo-tee", "name": "Classic Logo Tee", "price": 28, "qty": 2 },
  { "id": "trucker-hat",       "name": "Trucker Hat",       "price": 24, "qty": 1 }
]
```

Key: `saltyPawsCart`

---

## Key decisions

| Decision | Choice | Reason |
|---|---|---|
| Storage | `localStorage` | No backend needed; persists across sessions |
| Rendering | `createElement` + `textContent` | Prevents XSS from product names |
| Drawer close | `inert` attribute | Removes element from tab order + AT simultaneously |
| Qty minimum | Clamp to 1, disable `−` | Avoids 0-qty state; "Remove" is explicit action |
| Price math | `parseFloat` on read, `.toFixed(2)` on display | Keeps stored values as numbers, safe display |
