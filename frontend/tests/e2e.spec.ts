import { test, expect } from '@playwright/test';

test.describe('SentinelDesk E2E Core Journeys', () => {
  test('Flow 1: Login & Navigation to Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await expect(page).toHaveTitle(/SentinelDesk/i);

    await page.fill('input[type="email"]', 'admin@sentineldesk.io');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/app\/dashboard/);
    await expect(page.locator('h1')).toContainText('Security Command Overview');
  });

  test('Flow 2: Create Application Asset', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@sentineldesk.io');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.click('a[href="/app/applications"]');
    await expect(page.locator('h1')).toContainText('Monitored Assets');

    await page.click('button:has-text("Add Application")');
    await page.fill('input[placeholder*="Payment Gateway"]', 'Playwright E2E Service');
    await page.fill('textarea[placeholder*="Summary"]', 'Automated end-to-end test application asset');
    await page.click('button[type="submit"]:has-text("Create Application")');

    await expect(page.locator('body')).toContainText('Playwright E2E Service');
  });

  test('Flow 3 & 4: Create Vulnerability, Change Status & Add Comment', async ({ page }) => {
    await page.goto('http://localhost:5173/login');
    await page.fill('input[type="email"]', 'admin@sentineldesk.io');
    await page.fill('input[type="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await page.click('a[href="/app/vulnerabilities"]');
    await expect(page.locator('h1')).toContainText('Vulnerability Lifecycle');

    await page.click('button:has-text("Report Vulnerability")');
    await page.fill('input[placeholder*="Unauthenticated Remote"]', 'E2E Test Auth Bypass Vulnerability');
    await page.fill('textarea[placeholder*="Technical evidence"]', 'E2E attack vector test description');
    await page.click('button[type="submit"]:has-text("Create Vulnerability")');

    await expect(page.locator('body')).toContainText('E2E Test Auth Bypass Vulnerability');
    await page.click('a:has-text("E2E Test Auth Bypass Vulnerability")');

    // Status change
    await page.click('button:has-text("IN PROGRESS")');
    await expect(page.locator('body')).toContainText('IN PROGRESS');

    // Add comment
    await page.fill('input[placeholder*="Add a comment"]', 'E2E test comment payload');
    await page.click('button[type="submit"]');
    await expect(page.locator('body')).toContainText('E2E test comment payload');
  });
});
