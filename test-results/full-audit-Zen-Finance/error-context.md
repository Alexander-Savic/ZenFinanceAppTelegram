# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-audit.spec.ts >> Zen Finance — Сквозной E2E Аудит приложения >> 2. Управление счетами: создание счета
- Location: e2e\full-audit.spec.ts:38:7

# Error details

```
Error: locator.click: Error: strict mode violation: locator('text=Настройки').or(locator('text=Счета')) resolved to 2 elements:
    1) <h2 class="text-sm font-medium text-secondary">Счета</h2> aka getByRole('heading', { name: 'Счета' })
    2) <a href="/settings" class="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors text-secondary">…</a> aka getByRole('link', { name: 'Настройки' })

Call log:
  - waiting for locator('text=Настройки').or(locator('text=Счета'))

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - button "Open Next.js Dev Tools" [ref=e7] [cursor=pointer]
  - alert [ref=e11]
  - main [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]:
        - paragraph [ref=e15]: С возвращением,
        - heading "Dev 👋" [level=1] [ref=e16]
      - generic [ref=e17]:
        - heading "Счета" [level=2] [ref=e19]
        - button "Счёт" [ref=e21]
      - generic [ref=e24]:
        - heading "Последние операции" [level=2] [ref=e25]
        - generic [ref=e26]: Пока нет операций — добавьте первую транзакцию
      - button "Добавить транзакцию" [ref=e27]
  - navigation [ref=e29]:
    - list [ref=e30]:
      - listitem [ref=e31]:
        - link "Главная" [ref=e32] [cursor=pointer]:
          - /url: /
      - listitem [ref=e36]:
        - link "Аналитика" [ref=e37] [cursor=pointer]:
          - /url: /analytics
      - listitem [ref=e40]:
        - link "Подписки" [ref=e41] [cursor=pointer]:
          - /url: /subscriptions
      - listitem [ref=e47]:
        - link "Цели" [ref=e48] [cursor=pointer]:
          - /url: /budgets
      - listitem [ref=e53]:
        - link "Настройки" [ref=e54] [cursor=pointer]:
          - /url: /settings
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Zen Finance — Сквозной E2E Аудит приложения', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.addInitScript(() => {
  6  |       (window as any).Telegram = {
  7  |         WebApp: {
  8  |           initData: "dev_mock_init_data",
  9  |           initDataUnsafe: { user: { id: 123456789, first_name: "Dev" } },
  10 |           colorScheme: "light",
  11 |           themeParams: {},
  12 |           ready: () => {},
  13 |           expand: () => {},
  14 |           MainButton: { show: () => {}, hide: () => {}, onClick: () => {} },
  15 |           HapticFeedback: { impactOccurred: () => {} },
  16 |         },
  17 |       };
  18 |     });
  19 | 
  20 |     await page.goto('/');
  21 |     await page.waitForLoadState('networkidle');
  22 |   });
  23 | 
  24 |   test('1. Навигация по нижней панели (BottomNav)', async ({ page }) => {
  25 |     // Ищем контейнер навигации (nav или нижнюю панель)
  26 |     const bottomNav = page.locator('nav').or(page.locator('footer')).or(page.locator('div.fixed.bottom-0'));
  27 |     await expect(bottomNav.first()).toBeVisible();
  28 | 
  29 |     await page.locator('text=Аналитика').click();
  30 |     await expect(page.getByText('Доходы vs Расходы').or(page.getByText('Неделя')).or(page.getByText('Аналитика'))).toBeVisible();
  31 | 
  32 |     await page.locator('text=Цели').click();
  33 |     await expect(page.getByText('Копилка', { exact: true }).or(page.getByText('Накопления'))).toBeVisible();
  34 |     
  35 |     await page.locator('text=Главная').or(page.locator('text=Обзор')).click();
  36 |   });
  37 | 
  38 |   test('2. Управление счетами: создание счета', async ({ page }) => {
> 39 |     await page.locator('text=Настройки').or(page.locator('text=Счета')).click();
     |                                                                         ^ Error: locator.click: Error: strict mode violation: locator('text=Настройки').or(locator('text=Счета')) resolved to 2 elements:
  40 | 
  41 |     const addAccountBtn = page.getByText(/Добавить новый счет|Создать счет/i);
  42 |     if (await addAccountBtn.isVisible()) {
  43 |       await addAccountBtn.click();
  44 | 
  45 |       await page.getByPlaceholder(/Visa Gold|Tether|Кошелек/i).fill('Тестовый Карт-Счет');
  46 |       await page.getByPlaceholder('0.00').fill('1500');
  47 | 
  48 |       await page.getByRole('button', { name: /Создать|Сохранить/i }).click();
  49 |       await expect(page.getByText('Тестовый Карт-Счет')).toBeVisible();
  50 |     }
  51 |   });
  52 | 
  53 |   test('3. Поиск и фильтрация в истории транзакций', async ({ page }) => {
  54 |     const searchInput = page.getByPlaceholder(/Поиск/i);
  55 |     if (await searchInput.isVisible()) {
  56 |       await searchInput.fill('Такси');
  57 |       await page.waitForTimeout(300);
  58 | 
  59 |       await page.locator('button:has-text("Расходы")').click();
  60 |       await page.locator('button:has-text("Доходы")').click();
  61 |       await page.locator('button:has-text("Все")').click();
  62 | 
  63 |       await searchInput.clear();
  64 |     }
  65 |   });
  66 | 
  67 |   test('4. Взаимодействие с копилкой (GoalsAndPiggybank)', async ({ page }) => {
  68 |     await page.locator('text=Цели').click();
  69 | 
  70 |     const piggySwitch = page.getByRole('switch');
  71 |     if (await piggySwitch.isVisible()) {
  72 |       await piggySwitch.click();
  73 |     }
  74 |   });
  75 | });
```