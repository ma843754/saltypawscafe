'use strict';

require('@testing-library/jest-dom');
const { screen, within, fireEvent } = require('@testing-library/dom');

// ---------------------------------------------------------------------------
// Minimal DOM fixture – mirrors the cart markup in merch.html plus two merch
// cards so that "Add to Cart" event wiring in cart.js can be exercised.
// ---------------------------------------------------------------------------
const FIXTURE_HTML = `
  <button
    class="cart-icon-btn"
    id="cartOpenBtn"
    type="button"
    aria-label="Open cart"
    aria-expanded="false"
    aria-controls="cartDrawer"
  >&#128722;<span class="cart-badge" id="cartBadge" aria-hidden="true" hidden>0</span></button>

  <div class="cart-overlay" id="cartOverlay" aria-hidden="true"></div>

  <aside
    class="cart-drawer"
    id="cartDrawer"
    role="dialog"
    aria-modal="true"
    aria-labelledby="cartHeading"
    inert
  >
    <div class="cart-drawer__header">
      <h2 id="cartHeading">Your Cart</h2>
      <button class="cart-close-btn" id="cartCloseBtn" type="button" aria-label="Close cart">&#10005;</button>
    </div>
    <ul class="cart-items" id="cartItems"></ul>
    <div class="cart-drawer__footer">
      <div class="cart-total">Total: <span id="cartTotal">$0.00</span></div>
    </div>
  </aside>

  <div class="merch-card" data-id="test-tee" data-name="Test Tee" data-price="28.00">
    <div class="merch-body">
      <button class="btn-add-to-cart" type="button" aria-label="Add Test Tee to cart">Add to Cart</button>
    </div>
  </div>

  <div class="merch-card" data-id="test-hat" data-name="Test Hat" data-price="24.00">
    <div class="merch-body">
      <button class="btn-add-to-cart" type="button" aria-label="Add Test Hat to cart">Add to Cart</button>
    </div>
  </div>
`;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = FIXTURE_HTML;
  // Re-execute cart.js against the fresh DOM so module-level selectors
  // (getElementById, querySelectorAll) and event listeners bind to the new nodes.
  jest.resetModules();
  require('./cart.js');
});

// ---------------------------------------------------------------------------
// 1. "Add to Cart" button labels
// ---------------------------------------------------------------------------
describe('"Add to Cart" button labels', () => {
  test('each button is findable by its product-specific accessible name', () => {
    expect(screen.getByRole('button', { name: 'Add Test Tee to cart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Test Hat to cart' })).toBeInTheDocument();
  });

  test('every product button has a unique accessible name (none are duplicates)', () => {
    // getAllByRole with a regex that matches the pattern confirms each button
    // can be told apart — if two had the same name the count would still be 2
    // but getByRole (singular) below would throw on ambiguity.
    const addButtons = screen.getAllByRole('button', { name: /^add .+ to cart$/i });
    expect(addButtons).toHaveLength(2);

    // Confirm individual lookup works unambiguously for each name.
    screen.getByRole('button', { name: 'Add Test Tee to cart' });
    screen.getByRole('button', { name: 'Add Test Hat to cart' });
  });
});

// ---------------------------------------------------------------------------
// 2. Cart drawer ARIA structure
// ---------------------------------------------------------------------------
describe('Cart drawer ARIA structure', () => {
  test('drawer is exposed as a dialog role', () => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('drawer is named "Your Cart" via aria-labelledby', () => {
    // getByRole computes the accessible name through the labelledby chain,
    // so this assertion verifies both the attribute and the referenced heading.
    expect(screen.getByRole('dialog', { name: 'Your Cart' })).toBeInTheDocument();
  });

  test('drawer has aria-modal="true"', () => {
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  test('close button carries its own accessible name', () => {
    expect(screen.getByRole('button', { name: 'Close cart' })).toBeInTheDocument();
  });

  test('open button advertises collapsed state on load (aria-expanded="false")', () => {
    expect(
      screen.getByRole('button', { name: /open cart/i })
    ).toHaveAttribute('aria-expanded', 'false');
  });

  test('open button switches to aria-expanded="true" when the cart opens', () => {
    fireEvent.click(screen.getByRole('button', { name: /open cart/i }));
    expect(
      screen.getByRole('button', { name: /open cart/i })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('open button reverts to aria-expanded="false" when the cart closes', () => {
    fireEvent.click(screen.getByRole('button', { name: /open cart/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }));
    expect(
      screen.getByRole('button', { name: /open cart/i })
    ).toHaveAttribute('aria-expanded', 'false');
  });
});

// ---------------------------------------------------------------------------
// 3. Empty-cart message
// ---------------------------------------------------------------------------
describe('Empty-cart message', () => {
  test('is present as a real DOM node when the cart is empty', () => {
    // The message must be in the document as an actual element, not as
    // CSS-generated content (which jsdom never evaluates and getByText
    // would therefore never find).
    const cartList = document.getElementById('cartItems');
    expect(within(cartList).getByText('Your cart is empty.')).toBeInTheDocument();
  });

  test('is a child element of the cart items list, not CSS ::after', () => {
    const cartList = document.getElementById('cartItems');
    // At least one real child element must exist (the message <li>).
    expect(cartList.children.length).toBeGreaterThan(0);
  });

  test('disappears once a product is added', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));
    expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4. Quantity controls – per-item labels and grouping
// ---------------------------------------------------------------------------
describe('Quantity controls', () => {
  beforeEach(() => {
    // Put one item in the cart before each test in this block.
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));
  });

  test('decrease button label includes the item name', () => {
    expect(
      screen.getByRole('button', { name: 'Decrease quantity of Test Tee' })
    ).toBeInTheDocument();
  });

  test('increase button label includes the item name', () => {
    expect(
      screen.getByRole('button', { name: 'Increase quantity of Test Tee' })
    ).toBeInTheDocument();
  });

  test('remove button label includes the item name', () => {
    expect(
      screen.getByRole('button', { name: 'Remove Test Tee from cart' })
    ).toBeInTheDocument();
  });

  test('qty buttons are wrapped in a labelled group for that item', () => {
    const group = screen.getByRole('group', { name: 'Quantity for Test Tee' });
    expect(group).toBeInTheDocument();
    // Both stepper buttons are inside the group.
    expect(
      within(group).getByRole('button', { name: 'Decrease quantity of Test Tee' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('button', { name: 'Increase quantity of Test Tee' })
    ).toBeInTheDocument();
  });

  test('two different cart items produce two distinct, independently-labelled groups', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Hat to cart' }));

    const groups = screen.getAllByRole('group', { name: /^Quantity for /i });
    expect(groups).toHaveLength(2);

    // Each group is scoped to its own item.
    expect(
      within(groups[0]).getByRole('button', { name: /Decrease quantity of Test Tee/i })
    ).toBeInTheDocument();
    expect(
      within(groups[1]).getByRole('button', { name: /Decrease quantity of Test Hat/i })
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5. Cart total – announced clearly
// ---------------------------------------------------------------------------
describe('Cart total readability', () => {
  test('footer contains a readable "Total:" label alongside the amount', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));
    const footer = document.querySelector('.cart-drawer__footer');
    // Both pieces of text must be present so a screen reader reading the
    // region hears "Total: $28.00" rather than a bare number.
    expect(footer).toHaveTextContent('Total:');
    expect(footer).toHaveTextContent('$28.00');
  });

  test('total reflects correct line price after adding a second unit', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity of Test Tee' }));
    expect(document.getElementById('cartTotal')).toHaveTextContent('$56.00');
  });

  test('total reflects the sum of multiple distinct items', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));  // $28
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Hat to cart' }));  // $24
    expect(document.getElementById('cartTotal')).toHaveTextContent('$52.00');
  });
});

// ---------------------------------------------------------------------------
// 6. Cart open button label reflects live item count
// ---------------------------------------------------------------------------
describe('Cart open button label with item count', () => {
  test('reads "Open cart" when the cart is empty', () => {
    expect(screen.getByRole('button', { name: 'Open cart' })).toBeInTheDocument();
  });

  test('reads "Open cart, 1 item" (singular) after one item is added', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));
    expect(screen.getByRole('button', { name: 'Open cart, 1 item' })).toBeInTheDocument();
  });

  test('reads "Open cart, 2 items" (plural) after quantity reaches two', () => {
    const addBtn = screen.getByRole('button', { name: 'Add Test Tee to cart' });
    fireEvent.click(addBtn);
    fireEvent.click(addBtn);
    expect(screen.getByRole('button', { name: 'Open cart, 2 items' })).toBeInTheDocument();
  });

  test('counts total quantity across multiple distinct products', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Tee to cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Add Test Hat to cart' }));
    expect(screen.getByRole('button', { name: 'Open cart, 2 items' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 7. Focus management
// ---------------------------------------------------------------------------
describe('Focus management', () => {
  test('opening the cart moves focus to the close button', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open cart' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close cart' }));
  });

  test('closing the cart returns focus to the open button', () => {
    fireEvent.click(screen.getByRole('button', { name: 'Open cart' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }));
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /open cart/i })
    );
  });
});
