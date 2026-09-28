import { test, expect } from '@playwright/test';

test.describe('Zen Finance — Сквозной E2E Аудит приложения', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      (window as any).Telegram = {
        WebApp: {
          initData: "dev_mock_init_data",
          initDataUnsafe: { user: { id: 123456789, first_name: "Dev" } },
          colorScheme: "light",
          themeParams: {},
          ready: () => {},
          expand: () => {},
          MainButton: { show: () => {}, hide: () => {}, onClick: () => {} },
          HapticFeedback: { impactOccurred: () => {} },
        },
      };
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('1. Навигация по нижней панели (BottomNav)', async ({ page }) => {
    // Ищем контейнер навигации (nav или нижнюю панель)
    const bottomNav = page.locator('nav').or(page.locator('footer')).or(page.locator('div.fixed.bottom-0'));
    await expect(bottomNav.first()).toBeVisible();

    await page.locator('text=Аналитика').click();
    await expect(page.getByText('Доходы vs Расходы').or(page.getByText('Неделя')).or(page.getByText('Аналитика'))).toBeVisible();

    await page.locator('text=Цели').click();
    await expect(page.getByText('Копилка', { exact: true }).or(page.getByText('Накопления'))).toBeVisible();
    
    await page.locator('text=Главная').or(page.locator('text=Обзор')).click();
  });

  test('2. Управление счетами: создание счета', async ({ page }) => {
    
    const addAccountBtn = page.getByRole('button', { name: 'Счёт' });
    await expect(addAccountBtn).toBeVisible();
    await addAccountBtn.click();

    await page.getByPlaceholder(/Visa Gold|Tether|Кошелек/i).fill('Тестовый Карт-Счет');
    await page.getByPlaceholder('0.00').fill('1500');

    await page.getByRole('button', { name: 'Создать счёт' }).click();
    await expect(page.getByText('Тестовый Карт-Счет')).toBeVisible();
  });

  test('3. Поиск и фильтрация в истории транзакций', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Поиск/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Такси');
      await page.waitForTimeout(300);

      await page.locator('button:has-text("Расходы")').click();
      await page.locator('button:has-text("Доходы")').click();
      await page.locator('button:has-text("Все")').click();

      await searchInput.clear();
    }
  });

  test('4. Взаимодействие с копилкой (GoalsAndPiggybank)', async ({ page }) => {
    await page.locator('text=Цели').click();

    const piggySwitch = page.getByRole('switch');
    if (await piggySwitch.isVisible()) {
      await piggySwitch.click();
    }
  });
});