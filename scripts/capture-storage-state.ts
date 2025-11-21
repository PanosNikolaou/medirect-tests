import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the target page and rely on BasePage.closeCookieDialog via direct DOM click fallback
  await page.goto('https://www.medirect.com.mt/invest/equities/search', { waitUntil: 'domcontentloaded' });

  // Try to click a cookie/accept button via multiple selectors
  try {
    // common accept buttons
    const selectors = [
      'button:has-text("Accept")',
      'button:has-text("I accept")',
      'button:has-text("Agree")',
      'text=Accept',
    ];

    for (const sel of selectors) {
      try {
        const locator = page.locator(sel).first();
        if ((await locator.count()) && (await locator.isVisible())) {
          await locator.click({ timeout: 2000 });
          break;
        }
      } catch (e) {
        // ignore
      }
    }

    // As fallback try clicking inside any alertdialog
    try {
      const dialog = await page.$('[role="alertdialog"]');
      if (dialog) {
        const btn = await dialog.$('button');
        if (btn) await btn.click();
      }
    } catch (e) {
      // ignore
    }
  } catch (e) {
    // ignore
  }

  // Save storage state
  const outPath = path.resolve(process.cwd(), 'state.json');
  await context.storageState({ path: outPath });
  console.log('Saved storage state to', outPath);

  await browser.close();
})();

