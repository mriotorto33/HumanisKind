import { test, expect } from '@playwright/test';

test.describe('Advanced Streaming 3.0 - Live Security Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the Next.js demo dashboard locally
    await page.goto('http://127.0.0.1:3000');
    // Switch to V2 edge tab
    await page.click('button:has-text("v2.0 (Live Stream SDK Edge)")');
  });

  test('✅ Valid stream keeps playing normally with Ethical Pulse', async ({ page }) => {
    // Start the stream simulation
    await page.click('button:has-text("Initialize Live Stream")');

    // Wait for the UI to indicate the stream is playing securely
    await expect(page.locator('h2:has-text("▶ LIVE BROADCAST IS SECURE...")')).toBeVisible();

    // Verify the log registers successful serving
    await expect(page.locator('div:has-text("✅ SERVED Seq")').first()).toBeVisible();
  });

  test('❌ Deepfake Injection is physically dropped by Edge UI', async ({ page }) => {
    // Start the stream
    await page.click('button:has-text("Initialize Live Stream")');
    await expect(page.locator('h2:has-text("▶ LIVE BROADCAST IS SECURE...")')).toBeVisible();

    // Trigger the Deepfake injection
    await page.click('button:has-text("Inject Synthetic Deepfake (Blocked)")');

    // Verify video playback halted and UI reflects the Governance drop
    await expect(page.locator('h2:has-text("⏹ STREAM HALTED BY GOVERNANCE")')).toBeVisible();

    // Check for UI error message log
    await expect(page.locator('div:has-text("❌ BLOCKED Seq")').first()).toBeVisible();
  });

  test('🎟️ Authorized Ad Break plays without breaking the chain', async ({ page }) => {
    // Start stream
    await page.click('button:has-text("Initialize Live Stream")');
    await expect(page.locator('h2:has-text("▶ LIVE BROADCAST IS SECURE...")')).toBeVisible();

    // Click Authorized Ad Break
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/api/advanced-stream') && 
      response.url().includes('action=ad_break')
    );
    await page.click('button:has-text("Submit Authorized Ad-Break")');

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    // The stream should not have crashed, it should continue indicating it is secure
    // (In the UI simulation it doesn't drop the connection when ad_break is allowed)
    await expect(page.locator('h2:has-text("▶ LIVE BROADCAST IS SECURE...")')).toBeVisible();
  });
});
