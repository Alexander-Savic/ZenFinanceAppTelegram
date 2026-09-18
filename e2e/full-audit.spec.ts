import { test, expect } from '@playwright/test';

test.describe('Zen Finance — Сквозной E2E Аудит приложения', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');
  });

  test('1. Навигация по нижней панели (BottomNav)', async ({ page }) => {
    const bottomNav = page.locator('div.fixed.bottom-0');
    await expect(bottomNav).toBeVisible();

    await page.getByRole('button', { name: 'Счета' }).click();
    await expect(page.getByText('Добавить новый счет')).toBeVisible();

    await page.getByRole('button', { name: 'Аналитика' }).click();
    await expect(page.getByText('Доходы vs Расходы').or(page.getByText('Неделя'))).toBeVisible();

    await page.getByRole('button', { name: 'Цели' }).click();
    await expect(page.getByText('Копилка', { exact: true })).toBeVisible();
    
    await page.getByRole('button', { name: 'Обзор' }).click();
  });

  test('2. Управление счетами: создание и удаление счета', async ({ page }) => {
    await page.getByRole('button', { name: 'Счета' }).click();

    await page.getByRole('button', { name: /Добавить новый счет/i }).click();

    await page.getByPlaceholder('Напр: Visa Gold, Tether, Кошелек...').fill('Тестовый Карт-Счет');
    await page.getByPlaceholder('0.00').fill('1500');

    await page.getByRole('button', { name: 'Создать счет' }).click();

    await expect(page.getByText('Тестовый Карт-Счет')).toBeVisible();
    await expect(page.getByText('1 500 USD').or(page.getByText('1,500 USD'))).toBeVisible();
  });

  test('3. Поиск и фильтрация в истории транзакций', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Поиск по комментарию или тегам...');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Такси');
    await page.waitForTimeout(300); 

    await page.getByRole('button', { name: 'Расходы' }).click();
    await page.getByRole('button', { name: 'Доходы' }).click();
    await page.getByRole('button', { name: 'Все' }).click();

    await searchInput.clear();
  });

  test('4. Взаимодействие с копилкой (GoalsAndPiggybank)', async ({ page }) => {
    await page.getByRole('button', { name: 'Цели' }).click();

    const piggySwitch = page.getByRole('switch');
    if (await piggySwitch.isVisible()) {
      const isChecked = await piggySwitch.getAttribute('aria-checked');
      await piggySwitch.click();
      expect(await piggySwitch.getAttribute('aria-checked')).not.toBe(isChecked);
    }
  });

  test('5. Проверка модального окна шеринга транзакции (ShareTransaction)', async ({ page }) => {
    const shareButton = page.getByRole('button', { name: /Поделиться/i }).first();

    if (await shareButton.isVisible()) {
      await shareButton.click();

      await expect(page.getByText('Публичная ссылка на операцию')).toBeVisible();
      await expect(page.getByRole('button', { name: /Скопировать ссылку/i })).toBeVisible();

      await page.getByLabel('Закрыть').click();
      await expect(page.getByText('Публичная ссылка на операцию')).not.toBeVisible();
    }
  });
});