import { test, expect } from '@playwright/test';

test('storefront receives a real successful catalog response', async ({ page, request }) => {
  const api = await request.get('http://localhost:8080/api/products?size=1');
  expect(api.status()).toBe(200);
  expect((await api.json()).content).toBeInstanceOf(Array);
  const response = page.waitForResponse(res => new URL(res.url()).pathname === '/api/products' && res.request().method() === 'GET');
  await page.goto('/search');
  expect((await response).status()).toBe(200);
  await expect(page).toHaveTitle(/iCrowd/);
  await expect(page.getByRole('navigation').first()).toBeVisible();
});
