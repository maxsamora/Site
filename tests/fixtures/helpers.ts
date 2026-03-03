import { Page, expect } from '@playwright/test';

export async function waitForAppReady(page: Page) {
  await page.waitForLoadState('domcontentloaded');
}

export async function dismissToasts(page: Page) {
  await page.addLocatorHandler(
    page.locator('[data-sonner-toast], .Toastify__toast, [role="status"].toast, .MuiSnackbar-root'),
    async () => {
      const close = page.locator('[data-sonner-toast] [data-close], [data-sonner-toast] button[aria-label="Close"], .Toastify__close-button, .MuiSnackbar-root button');
      await close.first().click({ timeout: 2000 }).catch(() => {});
    },
    { times: 10, noWaitAfter: true }
  );
}

export async function checkForErrors(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const errorElements = Array.from(
      document.querySelectorAll('.error, [class*="error"], [id*="error"]')
    );
    return errorElements.map(el => el.textContent || '').filter(Boolean);
  });
}

// Admin login helper
export async function adminLogin(page: Page, username: string, password: string) {
  await page.goto('/admin');
  await page.waitForLoadState('domcontentloaded');
  
  // Fill in login form
  await page.getByTestId('admin-username-input').fill(username);
  await page.getByTestId('admin-password-input').fill(password);
  await page.getByTestId('admin-login-btn').click();
  
  // Wait for dashboard to appear
  await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });
}

// Admin logout helper
export async function adminLogout(page: Page) {
  await page.getByTestId('admin-logout-btn').click();
  await expect(page.getByTestId('admin-login-page')).toBeVisible();
}
