import { test, expect } from '@playwright/test';
import { searchCorrection } from '../src/features/products/api/searchCorrection.js';

test('correction requires a unique close catalog word', () => {
  expect(searchCorrection('chrager', { terms: ['USB Charger', 'Wireless Charger'] })).toBe('charger');
  expect(searchCorrection('cat', { terms: ['Case'] })).toBeNull();
  expect(searchCorrection('xxxxxx', { terms: ['Charger'] })).toBeNull();
  expect(searchCorrection('cose', { terms: ['Case', 'Rose'] })).toBeNull();
});

async function mockCatalog(page, exact = false) {
  const requests = [];
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/api/categories') return route.fulfill({ json: [] });
    if (url.pathname === '/api/products/suggestions') return route.fulfill({ json: { terms: ['USB Charger'], products: [], categories: [] } });
    if (url.pathname === '/api/products') {
      requests.push(url.searchParams);
      const found = url.searchParams.get('keyword') === 'charger' || exact;
      return route.fulfill({ json: { content: found ? [{ id: 1, name: 'USB Charger', price: 20, availableStock: 5, imageUrls: [] }] : [], totalElements: found ? 1 : 0, totalPages: found ? 1 : 0, number: 0, size: 8 } });
    }
    return route.fulfill({ json: [] });
  });
  return requests;
}

for (const submit of ['Enter', 'button']) test(`typo submitted with ${submit} returns related products and supports original wording`, async ({ page }) => {
  await mockCatalog(page);
  await page.goto('/search');
  const input = page.getByRole('searchbox').first();
  await input.fill('chrager');
  if (submit === 'Enter') await input.press('Enter');
  else await page.getByRole('button', { name: 'Search', exact: true }).first().click();
  await expect(page.getByText('Showing results for', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'USB Charger', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Search instead for “chrager”' }).click();
  await expect(page.getByText('No products found.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('No products found.', { exact: true })).toBeVisible();
});

test('correction keeps price, brand and sorting filters', async ({ page }) => {
  const requests = await mockCatalog(page);
  await page.goto('/search?q=chrager&brand=Anker&minPrice=10&sort=price_asc');
  await expect(page.getByText('Showing results for', { exact: false })).toBeVisible();
  const corrected = requests.find(params => params.get('keyword') === 'charger');
  expect(corrected.get('brand')).toBe('Anker');
  expect(corrected.get('minPrice')).toBe('10');
  expect(corrected.get('sort')).toBe('price_asc');
});

test('existing results take priority over correction', async ({ page }) => {
  const requests = await mockCatalog(page, true);
  await page.goto('/search?q=chrager');
  await expect(page.getByRole('heading', { name: 'USB Charger', exact: true })).toBeVisible();
  await expect(page.getByText('Showing results for', { exact: false })).toHaveCount(0);
  expect(requests.some(params => params.get('keyword') === 'charger')).toBe(false);
});
