# Development Process

How we built the shopping cart feature, and the workflow used throughout.

---

## Workflow

Each feature was broken into **5–8 reviewable steps** before writing any code.
Each step was scoped to roughly 5–10 minutes of review time and produced something testable in the browser.

After each step was coded, a **review pass** was done before moving on:
- Re-read every changed file fresh
- Check for bugs, edge cases, security issues, and UX problems
- Distinguish between "fix now" (real bugs) and "fix later" (deferred to the right step)
- Only apply fixes that were genuinely necessary at that point

This kept each step focused and prevented scope creep during implementation.

---

## Bugs caught in review (and when)

### Step 1 review
- **`<button>` missing `type="button"`** — defaults to `type="submit"`, would trigger form submission if ever wrapped in a `<form>`. Fixed immediately.

### Step 2 review
- **`getCart()` didn't validate array type** — `JSON.parse` returning `null` or `{}` would pass the `|| []` fallback but crash `.find()`. Fixed with `Array.isArray()` check.
- **`saveCart()` had no error handling** — `localStorage.setItem` throws `QuotaExceededError` in private browsing / full storage. Wrapped in `try/catch`.
- **`querySelector` without optional chaining** — a card missing a button would crash the entire listener setup. Added `?.`.

### Step 3 review
- **`aria-hidden` is insufficient for accessibility** — hides element from screen readers but doesn't remove it from tab order. Replaced with `inert` attribute, which handles AT visibility, tab order, and pointer events in one attribute.

### Step 4 review
- **XSS via `innerHTML` with `item.name`** — product names were embedded directly into a template literal used with `innerHTML`. Safe today (hardcoded data), but a real injection vector if product source ever changes. Replaced with `createElement` + `textContent` throughout.

### Step 5 review
- **`−` button has no disabled state at qty 1** — looked active but had no effect, creating UX confusion. Fixed by setting `decBtn.disabled = item.qty <= 1` and adding `:disabled` CSS (`opacity: 0.35; cursor: not-allowed`).

---

## Security notes

- All user-facing strings set via `textContent`, never `innerHTML`
- `aria-label` on the remove button uses template literal (safe — `setAttribute` does not parse HTML)
- `data-price` read via `parseFloat()` — `NaN` would be stored silently if price data were malformed, but source is hardcoded HTML so risk is negligible
- `localStorage` key is namespaced (`saltyPawsCart`) to avoid collisions with other scripts

---

## Files changed

| File | Role |
|---|---|
| `merch.html` | Product data attributes, button markup, drawer HTML, cart icon |
| `styles.css` | Button, drawer, overlay, badge, item, qty control styles |
| `cart.js` | All cart logic: storage, rendering, open/close, badge |

---

## Deferred items (known, not fixed)

These were identified in review but intentionally left for later:

- **Floating point arithmetic in total** — `0.1 + 0.2` precision issues are masked by `.toFixed(2)` for display. Working in integer cents would be safer if totals are ever compared or sent to a backend.
- **`focus-visible` styles on cart buttons** — keyboard users get browser-default outlines. Should be added in a polish pass.
- **Mobile layout at very narrow widths** — cart icon + hamburger menu may crowd at ~375px. Needs testing on device.
- **Escape key fires even when drawer is closed** — `closeCart()` is a no-op on a closed drawer so no visible bug, but the listener runs unconditionally.
