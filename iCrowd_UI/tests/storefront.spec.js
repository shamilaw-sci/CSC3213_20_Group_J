import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

const imagePath = fileURLToPath(new URL('../public/images/storefront-hero.png', import.meta.url));
const product = { id: 1, name: 'Everyday wireless headphones', description: 'Comfortable audio for work and travel.', price: 1000, availableStock: 10, imageUrls: ['/images/product-placeholder.svg'], category: { name: 'Headset' } };
async function setup(page, role = 'CUSTOMER') {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  let items = [{ product, quantity: 2 }];
  let hero = { headline: 'Upgrade your everyday.', subtitle: 'Smartphones, audio and everyday accessories.', imageUrl: null };
  const user = { id: 1, firstName: 'Kamal', lastName: 'Perera', email: 'kamal@example.com', phone: '0712345678', address: '42 Temple Road', district: 'Colombo', role };
  const orders = [];
  if (role) await page.addInitScript(() => localStorage.setItem('token', 'test-token'));
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route('https://*.tile.openstreetmap.org/**', route => route.abort());
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    let data = [];
    if (path === '/api/auth/me' || path === '/api/users/profile') data = user;
    if (path === '/api/cart') data = { items };
    if (path === '/api/cart/sync') { items = request.postDataJSON().items.map(item => ({ product, quantity: item.quantity })); data = { items }; }
    if (path === '/api/products') data = { content: [product, { ...product, id: 2, name: 'Premium smartphone with all-day battery', price: 125000 }], totalElements: 2, number: 0, size: 8, totalPages: 1 };
    if (path === '/api/categories') data = [{ id: 1, name: 'Headset' }];
    if (['/api/products/featured', '/api/products/latest', '/api/products/recommendations'].includes(path)) data = [product];
    if (path === '/api/promo/available') data = [{ valid: true, promoCode: 'SAVE100', discountAmount: 100 }];
    if (path === '/api/promo/validate') {
      const body = request.postDataJSON();
      data = { valid: ['SAVE100', 'MANUAL'].includes(body.code) && body.cartSubTotal >= 1500, promoCode: body.code, discountAmount: 100, message: 'Minimum spend is LKR 1,500.' };
    }
    if (path === '/api/orders/validate-shipping') {
      const body = request.postDataJSON(); const subTotal = body.items.reduce((sum, item) => sum + item.quantity * 1000, 0); const discount = body.promoCode ? 100 : 0;
      data = { valid: true, subTotal, discount, deliveryFee: 200, totalAmount: subTotal - discount + 200, deliveryType: 'STANDARD', estimatedDelivery: '3–5 business days' };
    }
    if (path === '/api/orders' && request.method() === 'POST') { orders.push(request.postDataJSON()); return route.fulfill({ status: 400, json: { message: 'Test order stopped' } }); }
    if (path === '/api/orders' && request.method() === 'GET') data = [{ id: 7, reference: 'ORD-REAL-7', createdAt: '2026-11-12T10:00:00', status: 'PROCESSING', paymentStatus: 'SUCCESS', paymentMethod: 'CARD', total: 2200, address: user.address, district: 'Colombo', items: [{ productId: 1, name: product.name, quantity: 2, price: 1000 }] }];
    if (path === '/api/storefront/hero') data = hero;
    if (path === '/api/admin/storefront/hero') { hero = { headline: 'Fresh tech for you', subtitle: 'Our latest collection.', imageUrl: '/storefront/hero/image?v=1' }; data = hero; }
    if (path === '/api/storefront/hero/image') return route.fulfill({ path: imagePath, contentType: 'image/png' });
    await route.fulfill({ json: data });
  });
  return { errors, orders };
}

test('search cards have LKR prices, clear actions and 500-rupee price steps', async ({ page }) => {
  const { errors } = await setup(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/search', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('LKR 125,000.00', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to cart', exact: true })).toHaveCount(1);
  const minimum = page.getByLabel('Minimum price (LKR)', { exact: true });
  await expect(minimum).toHaveAttribute('step', '500');
  await minimum.fill('500'); await minimum.press('ArrowUp'); await expect(minimum).toHaveValue('1000');
  await page.screenshot({ path: 'test-results/search-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/search-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('cart offers support selection, manual entry, removal and revalidation', async ({ page }) => {
  await setup(page);
  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Add promo code' }).click();
  await page.getByRole('button', { name: /SAVE100.*Select/ }).click();
  await expect(page.getByRole('status')).toContainText('SAVE100 applied');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Promo: SAVE100' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove cart promo code' }).click();
  await page.getByRole('button', { name: 'Add promo code' }).click();
  await page.getByLabel('Promo code', { exact: true }).fill('manual');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('MANUAL applied');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: `Decrease quantity of ${product.name}` }).click();
  await expect(page.getByText('Minimum spend is LKR 1,500.')).toBeVisible();
  await expect(page.getByText('You save LKR 100.00')).toHaveCount(0);
});

test('selected cart promo carries through shipping and payment into the order', async ({ page }) => {
  const { orders, errors } = await setup(page);
  await page.goto('/cart', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Add promo code' }).click();
  await page.getByRole('button', { name: /SAVE100.*Select/ }).click();
  await expect(page.getByRole('status')).toContainText('SAVE100 applied');
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await page.getByRole('button', { name: 'Continue to Payment' }).click();
  await expect(page.getByRole('heading', { name: 'Choose how to pay' })).toBeVisible();
  await expect(page.getByText('LKR 2,100.00', { exact: true })).toBeVisible();
  await expect(page.getByText('SAVE100 applied', { exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: 'test-results/payment-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/payment-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Pay with Card' }).click();
  await expect.poll(() => orders.length).toBe(1);
  expect(orders[0].promoCode).toBe('SAVE100'); expect(errors).toEqual([]);
});

test('landing has an electronics image and no public admin or technical footer links', async ({ page }) => {
  await setup(page, null);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const hero = page.getByRole('img', { name: 'Smartphone, headphones and everyday electronics' });
  await expect(hero).toBeVisible(); await expect.poll(() => hero.evaluate(image => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('footer a[href*="admin"]')).toHaveCount(0);
  await expect(page.getByText('API Online')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true });
});

test('admin can preview and save a banner that appears on the public homepage', async ({ page }) => {
  const { errors } = await setup(page, 'ADMIN');
  await page.goto('/admin/storefront', { waitUntil: 'domcontentloaded' });
  await page.getByLabel('Headline', { exact: true }).fill('Fresh tech for you');
  await page.getByLabel('Description', { exact: true }).fill('Our latest collection.');
  await page.getByLabel('Banner image', { exact: true }).setInputFiles(imagePath);
  await expect(page.getByRole('heading', { name: 'Fresh tech for you' })).toBeVisible();
  await page.getByRole('button', { name: 'Save banner' }).click();
  await expect(page.getByRole('status')).toContainText('Homepage banner saved');
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Fresh tech for you' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Smartphone, headphones and everyday electronics' })).toHaveAttribute('src', /storefront\/hero\/image/);
  expect(errors).toEqual([]);
});

test('order history shows real orders and readable statuses on mobile', async ({ page }) => {
  const { errors } = await setup(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/profile?tab=orders', { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('ORD-REAL-7', { exact: true })).toBeVisible();
  await expect(page.getByText('Preparing your order', { exact: true })).toBeVisible();
  await expect(page.getByText('ORD-89241')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/orders-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});
