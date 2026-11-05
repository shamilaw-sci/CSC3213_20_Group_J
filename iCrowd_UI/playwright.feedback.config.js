import { defineConfig } from '@playwright/test';
export default defineConfig({
  timeout: 60000, expect: { timeout: 15000 }, testDir: './tests', testMatch: 'feedback.spec.js', reporter: 'list', workers: 1,
  use: { baseURL: 'http://127.0.0.1:5189', screenshot: 'only-on-failure', trace: 'retain-on-failure', browserName: 'chromium', channel: 'msedge' },
  webServer: { command: 'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 5189', url: 'http://127.0.0.1:5189', reuseExistingServer: false }
});

