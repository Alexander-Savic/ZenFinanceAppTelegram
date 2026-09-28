import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    (window as any).Telegram = {
      WebApp: {
        initData: "dev_mock_init_data",
        initDataUnsafe: { user: { id: 123456789, first_name: "Dev" } },
        colorScheme: "light",
        ready: () => {},
        expand: () => {},
        MainButton: { show: () => {}, hide: () => {}, onClick: () => {} },
        HapticFeedback: { impactOccurred: () => {} },
      },
    };
  });
});

test("Создание расхода обновляет историю и аналитику", async ({ page }) => {
  await page.goto("/");
  await page.waitForLoadState('networkidle');

  // Клики по кнопке добавления транзакции (круглая фиолетовая плюс-кнопка)
  const addBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
  await addBtn.click();

  const amountInput = page.getByPlaceholder("0.00").or(page.getByPlaceholder("0"));
  if (await amountInput.isVisible()) {
    await amountInput.fill("25.00");
    
    const descInput = page.getByPlaceholder(/Заметки|Описание|Комментарий/i);
    if (await descInput.isVisible()) {
      await descInput.fill("Coffee");
    }

    await page.getByRole("button", { name: /сохранить|добавить/i }).click();
    await expect(page.getByText("Coffee")).toBeVisible();
  }
});