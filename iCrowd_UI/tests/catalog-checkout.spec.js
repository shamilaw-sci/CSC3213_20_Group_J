import { test, expect } from '@playwright/test';

const product = { id: 1, name: 'Test Keyboard', price: 1000, availableStock: 5, imageUrls: [], specifications: {}, category: { name: 'Accessories' } };
const checkout = { owner: '1', shippingFullName: 'Buyer', shippingEmail: 'buyer@example.com', shippingPhone: '0712345678', shippingAddress: 'Colombo', shippingDistrict: 'Colombo', deliveryType: 'STANDARD', subTotal: 1000, shippingCost: 200, items: [{ productId: 1, quantity: 1 }] };

async function setup(page, { stock = 5, items = [], failSync = false } = {}) {
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  await page.addInitScript(data => {
    localStorage.setItem('token', 'account-1');
    if (!sessionStorage.getItem('checkoutData')) sessionStorage.setItem('checkoutData', JSON.stringify(data));
  }, checkout);
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const path = new URL(route.request().url()).pathname;
    let data = [];
    if (path === '/api/auth/me') data = { id: 1, firstName: 'Buyer', email: 'buyer@example.com', role: 'CUSTOMER' };
    if (path === '/api/cart') data = { items };
    if (path === '/api/cart/sync') {
      if (failSync) return route.fulfill({ status: 503, json: {} });
      data = { items: route.request().postDataJSON().items.map(item => ({ product, quantity: item.quantity })) };
    }
    if (path === '/api/products/1') data = { ...product, availableStock: stock };
    if (/\/(reviews|questions)$/.test(path)) data = { content: [], last: true };
    await route.fulfill({ json: data });
  });
}

test('Buy Now adds the item and starts checkout; sold-out items cannot be bought', async ({ page }) => {
  test.setTimeout(60000);
  await setup(page);
  await page.goto('/product/1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Buy Now' })).toBeEnabled({ timeout: 15000 });
  await page.getByRole('button', { name: 'Buy Now' }).click();
  await expect(page).toHaveURL(/checkout\/shipping/);
  await page.route('**/api/products/1', route => route.fulfill({ json: { ...product, availableStock: 0 } }));
  await page.goto('/product/1', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Buy Now' })).toBeDisabled({ timeout: 15000 });
});

test('cart uses rupees, exposes quantity controls, and shows failed saves', async ({ page }) => {
  await setup(page, { items: [{ product, quantity: 1 }], failSync: true });
  await page.goto('/cart');
  await expect(page.getByText('Calculated at checkout')).toBeVisible();
  await expect(page.getByText('LKR 1,000.00').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Apply', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Increase quantity of Test Keyboard' }).click();
  await expect(page.getByRole('alert')).toContainText('have not been saved');
  await expect(page.getByRole('button', { name: 'Retry saving cart' })).toBeVisible();
});

test('payment waits for promo validation and submits the validated code', async ({ page }) => {
  await setup(page);
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/promo/validate', async route => {
    await pending;
    await route.fulfill({ json: { valid: true, discountAmount: 100, promoCode: 'SAVE' } });
  });
  await page.route('**/api/orders', route => route.fulfill({ status: 400, json: { message: 'Test order stopped' } }));
  await page.goto('/checkout/payment');
  await page.getByLabel('Promo code', { exact: true }).fill('SAVE');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('button', { name: /Pay with Card/ })).toBeDisabled();
  await expect(page.getByLabel('Promo code', { exact: true })).toBeDisabled();
  release();
  await expect(page.getByText('LKR 1,100.00', { exact: true })).toBeVisible();
  const request = page.waitForRequest(req => new URL(req.url()).pathname === '/api/orders');
  await page.getByRole('button', { name: /Pay with Card/ }).click();
  expect((await request).postDataJSON().promoCode).toBe('SAVE');
});

test('payment error ignores arbitrary URL text', async ({ page }) => {
  await setup(page);
  await page.goto('/checkout/error?message=Send%20money%20to%20attacker');
  await expect(page.getByText('Send money to attacker')).toHaveCount(0);
  await expect(page.getByText(/Check your order status before trying again/)).toBeVisible();
});

test('refund status stays on the order page and can be refreshed', async ({ page }) => {
  await setup(page);
  let refunded = false;
  await page.route('**/api/orders/7/payment-status', route => route.fulfill({ json: { orderId: 7, orderStatus: 'STOCK_UNAVAILABLE', paymentStatus: refunded ? 'REFUNDED' : 'REFUND_PENDING', unavailableProductId: 1 } }));
  await page.goto('/checkout/success?orderId=7');
  await expect(page.getByText(/Your refund is pending/)).toBeVisible();
  await expect(page).toHaveURL(/success\?orderId=7/);
  refunded = true;
  await page.getByRole('button', { name: 'Check refund status' }).click();
  await expect(page.getByText('Your payment has been refunded.')).toBeVisible();
});

test('logout removes checkout details and does not expose the account cart to guests', async ({ page }) => {
  await setup(page, { items: [{ product, quantity: 1 }] });
  await page.goto('/cart');
  await expect(page.getByText('Test Keyboard', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /logout|log out|sign out/i }).click();
  expect(await page.evaluate(() => sessionStorage.getItem('checkoutData'))).toBeNull();
  await page.getByRole('link', { name: /cart/i }).first().click();
  await expect(page.getByText('Your cart is empty')).toBeVisible();
});

test('a different account cannot reuse another account checkout or cached cart', async ({ page }) => {
  await setup(page);
  await page.addInitScript(item => sessionStorage.setItem('iCrowd_cart:1', JSON.stringify([{ product: item, quantity: 2 }])), product);
  await page.route('**/api/auth/me', route => route.fulfill({ json: { id: 2, email: 'second@example.com', firstName: 'Second', role: 'CUSTOMER' } }));
  const writes = [];
  await page.route('**/api/cart/sync', route => {
    writes.push(route.request().postDataJSON());
    return route.fulfill({ json: { items: [] } });
  });
  await page.goto('/checkout/payment');
  await expect(page).toHaveURL(/\/cart$/);
  await expect(page.getByText('Your cart is empty')).toBeVisible();
  expect(writes).toEqual([]);
});
