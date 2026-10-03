import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  workers: 1, 
  
  testIgnore: [
    '**/tests/**',
    '**/src/**',
    '**/__tests__/**',
    '**/*.test.ts',
    '**/*.test.tsx',
  ],

  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    launchOptions: {
      slowMo: 500,
    },
  },

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});