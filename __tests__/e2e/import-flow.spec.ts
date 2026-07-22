import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as crypto from 'crypto';

test.describe('CSV Data Import Flow', () => {
  test('user can upload and preview a CSV of suppliers', async ({ page }) => {
    // 1. Sign up to reach the dashboard
    const uniqueEmail = `e2e-import-${crypto.randomUUID()}@example.com`;
    await page.goto('/signup');
    await page.getByLabel('Your name').fill('Import E2E User');
    await page.getByLabel('Organization name').fill('Import Test Org');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });

    // 2. Navigate to Upload page
    await page.goto('/upload');
    await expect(page.getByRole('heading', { name: 'Upload data' })).toBeVisible();

    // 3. Ensure we are on the Suppliers tab
    const suppliersTab = page.getByRole('tab', { name: 'Suppliers' });
    await suppliersTab.click();

    // 4. Upload the mock fixture
    const fileInput = page.locator('input[type="file"]').first();
    const fixturePath = path.resolve(__dirname, 'fixtures', 'mock-suppliers.csv');
    await fileInput.setInputFiles(fixturePath);

    // 5. Assert validation success
    await expect(page.getByText('All validations passed.')).toBeVisible();

    // 6. Assert preview table content
    // Specifically looking for our edge cases
    await expect(page.getByRole('cell', { name: 'Test Supplier 1' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Test Supplier 2, LLC' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Edge Case %$' })).toBeVisible();

    // 7. Confirm import
    await page.getByRole('button', { name: 'Confirm & process' }).click();

    // 8. Assert success toast
    await expect(page.getByText('3 suppliers imported.')).toBeVisible();
  });
});
