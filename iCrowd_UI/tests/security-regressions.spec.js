import { test, expect } from '@playwright/test';

const first = { id: 1, name: 'Private account one cart', price: 1000, availableStock: 5, imageUrls: [] };
const second = { ...first, id: 2, name: 'Account two cart' };
async function setup(context, role = 'CUSTOMER') {
  await context.addInitScript(() => { if (!localStorage.getItem('token')) localStorage.setItem('token', 'account-1'); });
  await context.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await context.route('https://fonts.gstatic.com/**', route => route.abort());
  const writes = [];
  await context.route(url => url.pathname.startsWith('/api/'), async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    const accountTwo = request.headers().authorization === 'Bearer account-2';
    const user = { id: accountTwo ? 2 : 1, email: accountTwo ? 'second@example.com' : 'first@example.com', firstName: 'Buyer', lastName: 'Test', role };
    let data = [];
    if (path === '/api/auth/me' || path === '/api/users/profile') data = user;
    if (path === '/api/cart') data = { items: [{ product: accountTwo ? second : first, quantity: 1 }] };
    if (path === '/api/cart/sync') { writes.push({ token: request.headers().authorization, body: request.postDataJSON() }); data = { items: [] }; }
    if (path === '/api/products') data = { content: [], totalPages: 0, totalElements: 0 };
    if (path === '/api/orders') data = { content: [], last: true };
    if (path === '/api/admin/dashboard') data = { totalUsers: 3, totalProducts: 2, recentProducts: [], lowStockProducts: [], recentUsers: [] };
    if (path === '/api/marketing/preferences') data = { subscribed: false, pendingConfirmation: true, interests: '', brands: '' };
    await route.fulfill({ json: data });
  });
  return writes;
}

test('public pages remain usable while a signed-in cart is delayed', async ({ page, context }) => {
  await setup(context);
  let release; const pending = new Promise(resolve => { release = resolve; });
  await page.route('**/api/cart', async route => { await pending; await route.fulfill({ json: { items: [] } }); });
  try {
    await page.goto('/search', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('navigation').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'All products', exact: true })).toBeVisible();
  } finally { release(); }
});

test('switching accounts in another tab reloads the cart without copying old items', async ({ page, context }) => {
  const writes = await setup(context);
  await page.goto('/cart');
  await expect(page.getByText(first.name, { exact: true })).toBeVisible();
  const other = await context.newPage();
  await other.goto('/search');
  await other.evaluate(() => localStorage.setItem('token', 'account-2'));
  await expect(page.getByText(second.name, { exact: true })).toBeVisible();
  await expect(page.getByText(first.name, { exact: true })).toHaveCount(0);
  expect(writes.filter(write => write.token === 'Bearer account-2' && write.body.items.some(item => item.productId === first.id))).toEqual([]);
});

test('pending email subscriptions can be cancelled', async ({ page, context }) => {
  await setup(context);
  await page.goto('/profile');
  const consent = page.getByRole('checkbox', { name: /Email me relevant products/ });
  await expect(consent).toBeChecked(); await consent.uncheck();
  await expect(consent).not.toBeChecked();
  const saved = page.waitForRequest(req => new URL(req.url()).pathname === '/api/marketing/preferences' && req.method() === 'PUT');
  await page.getByRole('button', { name: 'Save email preferences' }).click();
  expect((await saved).postDataJSON().subscribed).toBe(false);
});

test('inventory staff can manage stock and cannot enter account administration', async ({ page, context }) => {
  await setup(context, 'INVENTORY_MANAGER');
  await page.goto('/admin');
  await expect(page.getByRole('link', { name: 'Products', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Users', exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Analytics', exact: true })).toHaveCount(0);
  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/login$/);
});

test('chargebacks and manual review never display an order confirmation or payment retry', async ({ page, context }) => {
  await setup(context);
  for (const [status, heading] of [['CHARGEBACK', 'Payment disputed'], ['REVIEW_REQUIRED', 'Payment under review']]) {
    await page.route('**/api/orders/7/payment-status', route => route.fulfill({ json: { orderId: 7, orderStatus: 'PROCESSING', paymentStatus: status } }));
    await page.goto('/checkout/success?orderId=7');
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.getByText('Order Confirmed!')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Retry|Pay with Card|Cash on Delivery/i })).toHaveCount(0);
  }
});
