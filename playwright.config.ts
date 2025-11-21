import { defineConfig, devices } from '@playwright/test';
import path from 'path';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  retries: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['allure-playwright']
  ],
  use: {
    headless: true,
    actionTimeout: 5000,
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry', // stores traces
    screenshot: 'only-on-failure', // captures screenshots for failed tests
    storageState: process.env.STORAGE_STATE || undefined,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  outputDir: path.join(__dirname, 'test-results'),
});
