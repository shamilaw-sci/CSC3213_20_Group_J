import { test, expect } from '@playwright/test';

async function openAssistant(page, withKey = true) {
  await page.addInitScript(enabled => {
    if (enabled) {
      localStorage.setItem('icrowd_gemini_key', 'test-evaluation-key');
      localStorage.setItem('icrowd_gemini_active', 'true');
    }
  }, withKey);
  await page.route('https://fonts.googleapis.com/**', route => route.fulfill({ contentType: 'text/css', body: '' }));
  await page.route('https://fonts.gstatic.com/**', route => route.abort());
  await page.route(url => url.pathname.startsWith('/api/'), route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/api/ai/chat') return route.fulfill({ json: {
      reply: 'The current catalog has evaluation headphones.',
      products: [], suggestions: [],
    } });
    if (path === '/api/products') return route.fulfill({ json: { content: [], totalPages: 0 } });
    return route.fulfill({ json: [] });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open AI Assistant' }).click();
}

test('a successful Gemini answer is identified and receives current store context', async ({ page }) => {
  let payload;
  await page.route('https://generativelanguage.googleapis.com/**', route => {
    payload = route.request().postDataJSON();
    expect(route.request().headers()['x-goog-api-key']).toBe('test-evaluation-key');
    expect(route.request().url()).not.toContain('?key=');
    return route.fulfill({ json: { candidates: [{ content: { parts: [{ text: 'Here are the evaluation headphones.' }] } }] } });
  });
  await openAssistant(page);
  await page.getByPlaceholder('Ask for Headsets, PowerBanks, Delivery, Warranty...').fill('Show headphones');
  await page.getByTitle('Send message').click();
  await expect(page.getByText('Here are the evaluation headphones.', { exact: true })).toBeVisible();
  await expect(page.getByText('✨ Google Gemini AI', { exact: true })).toBeVisible();
  expect(payload.systemInstruction.parts[0].text).toContain('current catalog has evaluation headphones');
});

test('Gemini failure is visible while the built-in answer still works', async ({ page }) => {
  await page.route('https://generativelanguage.googleapis.com/**', route => route.fulfill({ status: 429, json: {} }));
  await openAssistant(page);
  await page.getByPlaceholder('Ask for Headsets, PowerBanks, Delivery, Warranty...').fill('Show headphones');
  await page.getByTitle('Send message').click();
  await expect(page.getByText('The current catalog has evaluation headphones.', { exact: true })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Gemini usage limit' })).toBeVisible();
  await expect(page.getByText('✨ Google Gemini AI', { exact: true })).toHaveCount(0);
});

test('turning Gemini off is remembered after a reload', async ({ page }) => {
  await openAssistant(page, false);
  await page.getByTitle('Google Gemini AI Settings').click();
  await page.getByLabel('Gemini API key', { exact: true }).fill('test-evaluation-key');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByTitle('Google Gemini AI Settings').click();
  await page.getByLabel('Use Gemini for answers').uncheck();
  await page.reload();
  await page.getByRole('button', { name: 'Open AI Assistant' }).click();
  await page.getByTitle('Google Gemini AI Settings').click();
  await expect(page.getByLabel('Use Gemini for answers')).not.toBeChecked();
});
