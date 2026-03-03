import { test, expect } from '@playwright/test';

const ADMIN_USERNAME = 'maxwell';
const ADMIN_PASSWORD = 'dgWlSVkBmNiT3dJF0t2NXnlWPVukeOVR';
const BASE_URL = 'https://maxwell-security.preview.emergentagent.com';

test.describe('Golden Path - End to End User Journey', () => {
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

  test('public user journey - browse writeups and resources', async ({ page }) => {
    // Visit homepage
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check homepage elements
    await expect(page.getByRole('heading', { name: /Maxwell Ferreira/i })).toBeVisible();
    
    // Navigate to writeups
    await page.getByTestId('nav-link-writeups').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Writeups page should load
    await expect(page.locator('body')).toBeVisible();
    
    // Navigate to resources
    await page.getByTestId('nav-link-resources').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Resources page should load with filter buttons
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-tools')).toBeVisible();
    
    // Navigate to about page
    await page.getByTestId('nav-link-about').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
    
    // Navigate to contact page
    await page.getByTestId('nav-link-contact').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin journey - login, create resource, logout', async ({ page }) => {
    const uniqueId = `TEST_${Date.now()}`;
    const resourceTitle = `Golden Path Resource ${uniqueId}`;
    let createdResourceId: string | null = null;
    
    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Clear any existing session
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    
    // Login
    await page.getByTestId('admin-username-input').fill(ADMIN_USERNAME);
    await page.getByTestId('admin-password-input').fill(ADMIN_PASSWORD);
    await page.getByTestId('admin-login-btn').click();
    
    // Wait for dashboard
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });
    
    // Navigate to resources via navbar
    await page.getByTestId('nav-link-resources').click();
    await page.waitForLoadState('domcontentloaded');
    
    // Click add resource button
    await expect(page.getByTestId('add-resource-btn')).toBeVisible();
    await page.getByTestId('add-resource-btn').click();
    
    // Fill in the form
    await page.getByTestId('resource-title-input').fill(resourceTitle);
    await page.getByTestId('resource-description-input').fill('Golden path test resource');
    await page.getByTestId('resource-url-input').fill('https://example.com/golden-test');
    
    // Submit
    await page.getByTestId('resource-submit-btn').click();
    
    // Verify resource created
    await expect(page.getByText(resourceTitle)).toBeVisible({ timeout: 10000 });
    
    // Clean up - get resource ID from API and delete
    const response = await page.request.get(`${BASE_URL}/api/resources`);
    const resources = await response.json();
    const testResource = resources.find((r: any) => r.title === resourceTitle);
    if (testResource) {
      createdResourceId = testResource.id;
    }
    
    // Navigate back to admin
    await page.getByTestId('nav-admin').click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible();
    
    // Logout
    await page.getByTestId('admin-logout-btn').click();
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    
    // Clean up test data via API
    if (createdResourceId) {
      const encoded = Buffer.from(`${ADMIN_USERNAME}:${ADMIN_PASSWORD}`).toString('base64');
      await page.request.delete(`${BASE_URL}/api/admin/resources/${createdResourceId}`, {
        headers: { Authorization: `Basic ${encoded}` }
      });
    }
  });
});
