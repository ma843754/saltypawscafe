I built a client-side shopping cart feature for the Merch page of my Salty Paws Café site. Users can click “Add to Cart” on a product, adjust quantities with + and − buttons, remove items, and see a live-updating subtotal and total. The cart state persists using localStorage, so refreshing the page does not clear the cart. The goal was to simulate a real e-commerce interaction without adding backend payment logic.

Working in micro-iterations felt slower at first because I’m used to asking for full features in one prompt. However, breaking it into small, testable steps made debugging much easier. After each change, I could test one behavior—like incrementing quantity—without wondering what else might have broken. It felt more controlled and intentional.

During self-review, the AI consistently caught edge cases. For example, it pointed out that quantity could drop below 1 if I didn’t clamp the value, and that duplicate “Add to Cart” clicks should increase quantity instead of creating multiple identical entries. It also suggested guarding against JSON parsing errors when loading from localStorage. One issue it missed that I caught was a mismatch between the cart container ID in HTML and the one referenced in JavaScript, which prevented rendering.

Compared to CLI tools, the browser-based experience was easier for reviewing changes and capturing screenshots. The CLI feels faster for experienced workflows but can encourage larger, less-controlled edits. I would use micro-iteration and self-review for interactive features involving state and user input. I would skip it for minor styling or simple content updates where the overhead isn’t necessary.

## Workflow

Each feature was broken into 6 reviewable steps before writing any code.
Each step was scoped to roughly 5–10 minutes of review time and produced something testable in the browser.

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
- **`−` button has no disabled state at qty 1** — looked active but had no effect, creating UX confusion. Fixed by setting `decBtn.disabled = item.qty <= 1` and adding `:disabled` CSS.
