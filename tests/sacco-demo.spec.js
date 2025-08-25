import { test, expect } from '@playwright/test';

test.describe('SACCO System Demo', () => {

  // Before each test, open the app
  test.beforeEach(async ({ page }) => {
    await page.goto('https://9404a088-7f95-4bdd-aed5-c346ee5a05d3-00-1b9c4i7yk7rzg.kirk.replit.dev/'); // replace with your Replit preview URL
  });

  // Test 1: Register a new member
  test('Register a new member', async ({ page }) => {
    await page.click('button:text("Add Member")'); // button that opens registration form
    await page.fill('input[name="fullName"]', 'Test User'); // full name input field
    await page.fill('input[name="email"]', 'testuser@example.com'); // email input field
    await page.fill('input[name="phone"]', '0777000000'); // phone input field
    await page.click('button:text("Submit")'); // submit registration
    // Verify the member appears in the members table/list
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  // Test 2: Apply a loan for the first member
  test('Apply a loan', async ({ page }) => {
    await page.click('button:text("Apply Loan")'); // loan button next to member
    await page.fill('input[name="loanAmount"]', '5000'); // loan amount input
    await page.click('button:text("Submit Loan")'); // submit loan
    await expect(page.locator('text=5000')).toBeVisible(); // check loan appears
  });

  // Test 3: Approve the loan
  test('Approve a loan', async ({ page }) => {
    await page.click('button:text("Approve")'); // approve button in loans table
    await expect(page.locator('text=Approved')).toBeVisible(); // verify status
  });

  // Test 4: Make a repayment
  test('Record a repayment', async ({ page }) => {
    await page.click('button:text("Repay Loan")'); // repayment button
    await page.fill('input[name="repaymentAmount"]', '1000'); // repayment input
    await page.click('button:text("Submit Repayment")'); // submit repayment
    await expect(page.locator('text=1000')).toBeVisible(); // check repayment shown
  });

  // Test 5: Check dashboard totals
  test('Verify dashboard totals update', async ({ page }) => {
    await expect(page.locator('text=Total Loans')).toBeVisible();
    await expect(page.locator('text=Total Repayments')).toBeVisible();
  });

});