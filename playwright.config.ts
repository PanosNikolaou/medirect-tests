import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  // Reporters: list for console output, html and json for CI/inspection
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    headless: true,
    // Allow tests to use a pre-captured storage state (set in CI via env STORAGE_STATE)
    storageState: process.env.STORAGE_STATE || undefined,
    baseURL: 'http://localhost:3000',
    actionTimeout: 5000,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
