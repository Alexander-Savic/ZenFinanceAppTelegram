import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Задаем корневую директорию для e2e тестов
  testDir: './e2e',
  
  // Ищем только файлы .spec.ts строго внутри папки e2e
  testMatch: /.*\.spec\.ts/,
  
  // Исключаем любые юнит-тесты из поиска
  testIgnore: [
    '**/tests/**',
    '**/*.test.tsx',
    '**/*.test.ts',
  ],

  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    launchOptions: {
      slowMo: 1000,
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