import { test, expect } from '@playwright/test';

test.describe('Landing page', () => {
  test('shows hero content and the interactive demo responds to scenario clicks', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /supply chain/i })).toBeVisible();

    const foodTab = page.getByRole('tab', { name: 'Food Supply Chain' });
    await foodTab.click();
    await expect(foodTab).toHaveAttribute('aria-selected', 'true');

    // Toggling Scope 3 visibility should change the total readout.
    const scope3Toggle = page.getByLabel('Show Scope 3 (transport)');
    const totalBefore = await page.locator('text=Total estimated emissions').locator('..').locator('p').first().innerText();
    await scope3Toggle.uncheck();
    const totalAfter = await page.locator('text=Total estimated emissions').locator('..').locator('p').first().innerText();
    expect(totalAfter).not.toBe(totalBefore);
  });

  test('navigates to signup and login from the header', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Sign up' }).click();
    await expect(page).toHaveURL(/\/signup/);
    await page.goto('/');
    await page.getByRole('link', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Signup → dashboard flow', () => {
  test('a new user can sign up and reach the dashboard', async ({ page }) => {
    const uniqueEmail = `e2e-${Date.now()}@example.com`;

    await page.goto('/signup');
    await page.getByLabel('Your name').fill('E2E Test User');
    await page.getByLabel('Organization name').fill('E2E Test Org');
    await page.getByLabel('Email').fill(uniqueEmail);
    await page.getByLabel('Password').fill('TestPassword123!');
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });
});

test.describe('Demo login walkthrough', () => {
  test.skip(!process.env.E2E_DEMO_SEEDED, 'Requires the seeded demo account (npm run db:seed)');

  test('demo user can log in, see seeded data, and view insights', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('demo@ecosphere.dev');
    await page.getByLabel('Password').fill('EcoSphereDemo123!');
    await page.getByRole('button', { name: 'Log in' }).click();

    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText('Total emissions')).toBeVisible();

    await page.getByRole('link', { name: 'Insights' }).click();
    await expect(page).toHaveURL(/\/insights/);
  });
});

test.describe('Accessibility smoke checks', () => {
  test('landing page has no obvious heading/landmark issues', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('main#main')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
  });

  test('mobile viewport reflows without horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto('/');
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(viewportWidth + 1); // +1px rounding tolerance
  });
});
