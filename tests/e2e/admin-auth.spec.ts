import { test, expect } from '@playwright/test';

const ADMIN_USERNAME = 'maxwell';
const ADMIN_PASSWORD = 'dgWlSVkBmNiT3dJF0t2NXnlWPVukeOVR';

test.describe('Admin Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Remove Emergent badge if present
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent-badge"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    
    // Clear session storage before each test
    await page.goto('/admin');
    await page.evaluate(() => sessionStorage.clear());
  });

  test('admin login page displays correctly', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify login form elements
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    await expect(page.getByTestId('admin-username-input')).toBeVisible();
    await expect(page.getByTestId('admin-password-input')).toBeVisible();
    await expect(page.getByTestId('admin-login-btn')).toBeVisible();
    
    // Check for "Admin Access" heading
    await expect(page.getByRole('heading', { name: /Admin Access/i })).toBeVisible();
  });

  test('admin login with valid credentials succeeds', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill in login form
    await page.getByTestId('admin-username-input').fill(ADMIN_USERNAME);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    
    // Click login button
    await page.getByTestId('admin-login-btn').click();
    
    // Wait for dashboard to appear
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    
    // Verify dashboard elements
    await expect(page.getByTestId('admin-new-writeup-btn')).toBeVisible();
    await expect(page.getByTestId('admin-logout-btn')).toBeVisible();
  });

  test('admin login with invalid credentials fails', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Fill in invalid credentials
    await page.getByTestId('admin-username-input').fill('wronguser');
    await page.getByTestId('admin-password-input').fill('wrongpass');
    
    // Click login button
    await page.getByTestId('admin-login-btn').click();
    
    // Should still show login page (not dashboard)
    await expect(page.getByTestId('admin-login-page')).toBeVisible({ timeout: 5000 });
    
    // Dashboard should NOT be visible
    await expect(page.getByTestId('admin-dashboard')).not.toBeVisible();
  });

  test('admin logout works correctly', async ({ page }) => {
    // First login
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByTestId('admin-username-input').fill(ADMIN_USERNAME);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-btn').click();
    
    // Wait for dashboard
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    
    // Click logout
    await page.getByTestId('admin-logout-btn').click();
    
    // Should return to login page
    await expect(page.getByTestId('admin-login-page')).toBeVisible({ timeout: 5000 });
  });

  test('admin dashboard shows stats after login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Login
    await page.getByTestId('admin-username-input').fill(ADMIN_USERNAME);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-btn').click();
    
    // Wait for dashboard
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    
    // Check for stats sections - use more specific selectors within dashboard
    const dashboard = page.getByTestId('admin-dashboard');
    await expect(dashboard.getByText('Total Writeups')).toBeVisible();
    await expect(dashboard.getByText('PUBLISHED')).toBeVisible();
    await expect(dashboard.getByText('DRAFTS')).toBeVisible();
  });
});
