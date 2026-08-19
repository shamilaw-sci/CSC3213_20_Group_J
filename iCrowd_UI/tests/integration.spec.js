import { test, expect } from '@playwright/test';

test('App loads successfully and can hit API', async ({ page }) => {
  // 1. Navigate to the frontend homepage
  await page.goto('/');

  // 2. Wait until there are no more active network connections (meaning API calls finished)
  await page.waitForLoadState('networkidle');

  // 3. Verify the main page title loaded
  await expect(page).toHaveTitle(/iCrowd/);
  
  // Note: Since this is a generic smoke test, as long as the page loads 
  // and reaches networkidle without crashing, it proves the UI booted.
  // In the future, you can add specific assertions here (e.g. expect(page.getByText('Products')).toBeVisible())
});
