import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  testMatch: ['catalog-checkout.spec.js','feedback.spec.js','filtering.spec.js','search-correction.spec.js','storefront.spec.js'],
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'list',
  workers: 1,
  use: { baseURL: 'http://127.0.0.1:5189', browserName: 'chromium', channel: 'msedge', screenshot: 'only-on-failure' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5189', url: 'http://127.0.0.1:5189', reuseExistingServer: false }
});
