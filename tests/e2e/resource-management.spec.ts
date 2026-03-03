import { test, expect } from '@playwright/test';

const ADMIN_USERNAME = 'maxwell';
const ADMIN_PASSWORD = 'dgWlSVkBmNiT3dJF0t2NXnlWPVukeOVR';

test.describe('Resource Management - Admin CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Remove Emergent badge if present
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent-badge"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
  });

  test('add resource button not visible without login', async ({ page }) => {
    await page.goto('/resources');
    await page.waitForLoadState('domcontentloaded');
    
    // Add resource button should not be visible when not authenticated
    await expect(page.getByTestId('add-resource-btn')).not.toBeVisible();
  });

  test('add resource button visible after admin login via nav', async ({ page }) => {
    // First login as admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear session storage first
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByTestId('admin-username-input').fill(ADMIN_USERNAME);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-btn').click();
    
    // Wait for dashboard
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    
    // Navigate to resources page via navbar link (preserves state)
    await page.getByTestId('nav-link-resources').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Add resource button should now be visible
    await expect(page.getByTestId('add-resource-btn')).toBeVisible();
  });

  test('create resource successfully', async ({ page }) => {
    const uniqueId = `TEST_${Date.now()}`;
    const resourceTitle = `Test Resource ${uniqueId}`;
    
    // Login as admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    await page.getByTestId('admin-username-input').fill(ADMIN_USERNAME);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-btn').click();
    
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    
    // Navigate to resources page via navbar link
    await page.getByTestId('nav-link-resources').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Click add resource button
    await page.getByTestId('add-resource-btn').click();
    
    // Fill in the form
    await page.getByTestId('resource-title-input').fill(resourceTitle);
    await page.getByTestId('resource-description-input').fill('Automated test resource description');
    await page.getByTestId('resource-url-input').fill('https://example.com/test');
    
    // Submit the form
    await page.getByTestId('resource-submit-btn').click();
    
    // Wait for the dialog to close and verify resource was created
    await expect(page.getByText(resourceTitle)).toBeVisible({ timeout: 10000 });
  });
});
