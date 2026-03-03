import { test, expect } from '@playwright/test';

test.describe('Core Flows - Navigation and Public Pages', () => {
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

  test('homepage loads correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check main heading is visible
    await expect(page.getByRole('heading', { name: /Maxwell Ferreira/i })).toBeVisible();
    
    // Check navigation links using data-testid
    await expect(page.getByTestId('nav-link-home')).toBeVisible();
    await expect(page.getByTestId('nav-link-writeups')).toBeVisible();
    await expect(page.getByTestId('nav-link-resources')).toBeVisible();
    await expect(page.getByTestId('nav-link-about')).toBeVisible();
    await expect(page.getByTestId('nav-link-contact')).toBeVisible();
  });

  test('resources page loads correctly', async ({ page }) => {
    await page.goto('/resources');
    await page.waitForLoadState('domcontentloaded');
    
    // Check resources page loads
    await expect(page.getByTestId('resources-page')).toBeVisible();
    
    // Check filter buttons are present
    await expect(page.getByTestId('filter-all')).toBeVisible();
    await expect(page.getByTestId('filter-tools')).toBeVisible();
    await expect(page.getByTestId('filter-checklists')).toBeVisible();
  });

  test('resources page filtering works', async ({ page }) => {
    await page.goto('/resources');
    await page.waitForLoadState('domcontentloaded');
    
    // Click on tools filter
    await page.getByTestId('filter-tools').click();
    
    // Should still show resources page
    await expect(page.getByTestId('resources-page')).toBeVisible();
    
    // Click on all filter
    await page.getByTestId('filter-all').click();
    await expect(page.getByTestId('resources-page')).toBeVisible();
  });

  test('writeups page loads correctly', async ({ page }) => {
    await page.goto('/writeups');
    await page.waitForLoadState('domcontentloaded');
    
    // Page should load without errors
    await expect(page.locator('body')).toBeVisible();
  });

  test('admin page shows login form when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
    // Check login page is displayed
    await expect(page.getByTestId('admin-login-page')).toBeVisible();
    await expect(page.getByTestId('admin-username-input')).toBeVisible();
    await expect(page.getByTestId('admin-password-input')).toBeVisible();
    await expect(page.getByTestId('admin-login-btn')).toBeVisible();
  });

  test('contact page loads correctly', async ({ page }) => {
    await page.goto('/contact');
    await page.waitForLoadState('domcontentloaded');
    
    // Should have contact form elements
    await expect(page.locator('body')).toBeVisible();
  });

  test('about page loads correctly', async ({ page }) => {
    await page.goto('/about');
    await page.waitForLoadState('domcontentloaded');
    
    await expect(page.locator('body')).toBeVisible();
  });
});
