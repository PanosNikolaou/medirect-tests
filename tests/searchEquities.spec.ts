import { test, expect } from '@playwright/test';
import { EquitiesSearchPage } from '../pages/EquitiesSearchPage';
import { EquityDetailsPage } from '../pages/EquityDetailsPage';
import path from 'path';
import fs from 'fs';

// Helper: get equity name from environment or CLI args
function getCliOrEnvEquityName(): string | null {
  if (process.env.EQUITY_NAME?.trim()) return process.env.EQUITY_NAME.trim();

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--equity=')) return a.split('=')[1].trim();
    if (a === '--equity' && i + 1 < argv.length && !argv[i + 1].startsWith('-')) return argv[i + 1].trim();
  }
  return null;
}

const providedEquity = getCliOrEnvEquityName();

test.describe('Medirect Equities Search Tests', () => {
  let searchPage: EquitiesSearchPage;
  let detailsPage: EquityDetailsPage;

  test.beforeEach(async ({ page }) => {
    searchPage = new EquitiesSearchPage(page);
    detailsPage = new EquityDetailsPage(page);
    await searchPage.navigate('https://www.medirect.com.mt/invest/equities/search');
  });

  /**
   * Generic helper for searching and verifying equities
   * Automatically captures screenshot if test fails
   */
  async function searchAndVerify(
    equityName: string,
    expectExists: boolean,
    page: any
  ) {
    try {
      await searchPage.searchEquity(equityName);

      if (expectExists) {
        try {
          await searchPage.clickMoreInfo(equityName);
        } catch {
          await searchPage.clickFirstMoreInfo();
        }

        const restrictedMessage = await detailsPage.getRestrictedMessage().catch(() => null);
        if (restrictedMessage) {
          expect(restrictedMessage).toContain('You are not authorized');
        } else {
          expect(await detailsPage.isDetailsVisible()).toBeTruthy();
        }
      } else {
        const noResults = await searchPage.isNoResultsVisible();
        expect(noResults).toBeTruthy();
      }
    } catch (err) {
      // Ensure screenshots folder exists
      const screenshotsDir = path.resolve('test-results/screenshots');
      if (!fs.existsSync(screenshotsDir)) fs.mkdirSync(screenshotsDir, { recursive: true });

      // Save screenshot with timestamp and equity name
      const filePath = path.join(
        screenshotsDir,
        `${equityName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.png`
      );
      await page.screenshot({ path: filePath, fullPage: true });

      console.error(`❌ Equity test failed for "${equityName}". Screenshot saved at: ${filePath}`);
      throw err; // re-throw to mark test as failed
    }
  }

  test('Navigate security types and check equities list', async () => {
    const count = await searchPage.getResultsCount();
    expect(count).toBeGreaterThan(0);
  });

  test('Search for a popular equity and click More Information', async ({ page }) => {
    const popularEquity = providedEquity ?? 'Maltacom';
    await searchAndVerify(popularEquity, true, page);
  });

  test('Search for a non-existent equity', async ({ page }) => {
    await searchAndVerify('NONEXISTENT123', false, page);
  });
});
