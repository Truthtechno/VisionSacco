import { test, expect } from '@playwright/test';

test.use({ browserName: 'webkit' }); // ✅ Safari engine, works in Replit

test('SACCO system demo - register flow', async ({ page }) => {
  // Replace this with your real Replit web preview URL
  await page.goto('http://localhost:3000');

  // Register a new member
  await page.click('#register-button');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'password123');
  await page.click('#submit-register');

  await expect(page.locator('.success')).toHaveText(/registered/i);
});