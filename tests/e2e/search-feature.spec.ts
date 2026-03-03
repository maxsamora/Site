import { test, expect } from '@playwright/test';

test.describe('Global Search Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Remove Emergent badge if present
    await page.addInitScript(() => {
      const observer = new MutationObserver(() => {
        const badge = document.querySelector('[class*="emergent"], [id*="emergent-badge"]');
        if (badge) badge.remove();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('search button is visible in navbar', async ({ page }) => {
    // Check desktop search button is visible
    await expect(page.getByTestId('nav-search-btn')).toBeVisible();
    
    // Check it has search text (on larger screens)
    const searchBtn = page.getByTestId('nav-search-btn');
    await expect(searchBtn).toContainText('Search');
  });

  test('search dialog opens on button click and keyboard shortcut', async ({ page }) => {
    // Click the search button
    await page.getByTestId('nav-search-btn').click();
    
    // Verify search input appears
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Verify placeholder text
    await expect(page.getByTestId('search-input')).toHaveAttribute('placeholder', /Search writeups, resources, tags/i);
    
    // Close with ESC
    await page.keyboard.press('Escape');
    await expect(page.getByTestId('search-input')).not.toBeVisible();
    
    // Open with keyboard shortcut Ctrl+K
    await page.keyboard.press('Control+k');
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('search shows placeholder when query is too short', async ({ page }) => {
    // Open search dialog
    await page.getByTestId('nav-search-btn').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Type a single character
    await page.getByTestId('search-input').fill('a');
    
    // Should still show the "Type to search" message (within dialog)
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText('Type to search')).toBeVisible();
  });

  test('search returns writeup results and navigation works', async ({ page }) => {
    // Open search dialog
    await page.getByTestId('nav-search-btn').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Search for a known writeup - "Lame" exists in the database
    await page.getByTestId('search-input').fill('Lame');
    
    // Wait for search results - look for writeup result buttons with data-testid
    const writeupResult = page.locator('[data-testid^="search-result-writeup-"]').first();
    await expect(writeupResult).toBeVisible({ timeout: 15000 });
    
    // Verify the result contains expected text
    await expect(writeupResult).toContainText('Lame');
    await expect(writeupResult).toContainText('easy');
    
    // Click on the first writeup result to test navigation
    await writeupResult.click();
    
    // Should navigate to the writeup page
    await expect(page).toHaveURL(/\/writeup\//);
    
    // The search dialog should close
    await expect(page.getByTestId('search-input')).not.toBeVisible();
  });

  test('search shows no results message when nothing matches', async ({ page }) => {
    // Open search dialog
    await page.getByTestId('nav-search-btn').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Search for something that doesn't exist
    await page.getByTestId('search-input').fill('xyznonexistent123');
    
    // Wait for "No results found" message within the dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog.getByText(/No results found/)).toBeVisible({ timeout: 10000 });
  });

  test('search dialog closes on ESC key', async ({ page }) => {
    // Open search dialog
    await page.getByTestId('nav-search-btn').click();
    await expect(page.getByTestId('search-input')).toBeVisible();
    
    // Press ESC
    await page.keyboard.press('Escape');
    
    // Dialog should close
    await expect(page.getByTestId('search-input')).not.toBeVisible();
  });
});
