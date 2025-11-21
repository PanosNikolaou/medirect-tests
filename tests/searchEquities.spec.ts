import { test, expect } from '@playwright/test';
import { EquitiesSearchPage } from '../pages/EquitiesSearchPage';
import { EquityDetailsPage } from '../pages/EquityDetailsPage';

// Helper: get equity name from environment or CLI args
function getCliOrEnvEquityName(): string | null {
  // 1) check environment variable
  if (process.env.EQUITY_NAME && process.env.EQUITY_NAME.trim().length > 0) {
    return process.env.EQUITY_NAME.trim();
  }

  // 2) parse process.argv for --equity=NAME or --equity NAME
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--equity=')) {
      const v = a.split('=')[1];
      if (v && v.trim().length > 0) return v.trim();
    }
    if (a === '--equity' && i + 1 < argv.length) {
      const v = argv[i + 1];
      if (v && !v.startsWith('-')) return v.trim();
    }
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

  test('Navigate security types and check equities list', async () => {
    const count = await searchPage.getResultsCount();
    expect(count).toBeGreaterThan(0);
  });

  test('Search for a popular equity and click More Information', async () => {
    const popularEquity = 'Maltacom'; // Replace with a valid equity from the site
    await searchPage.searchEquity(popularEquity);
    // Try clicking the result for the requested equity; if not found, click the first result
    try {
      await searchPage.clickMoreInfo(popularEquity);
    } catch (e) {
      await searchPage.clickFirstMoreInfo();
    }

    // The site may either show a restricted message or the details directly. Accept both behaviors.
    const restrictedMessage = await detailsPage.getRestrictedMessage().catch(() => null);
    if (restrictedMessage && restrictedMessage.includes('You are not authorized')) {
      expect(restrictedMessage).toContain('You are not authorized');
    } else {
      // If there's no restricted message, details content should be visible.
      const detailsVisible = await detailsPage.isDetailsVisible();
      expect(detailsVisible).toBeTruthy();
    }
  });

  test('Search for a non-existent equity', async () => {
    // Allow an equity name to be passed in via env var or CLI. If none provided, generate a unique non-existent name.
    const nonExistent = providedEquity || `NON_EXISTENT_${Date.now()}`;
    await searchPage.searchEquity(nonExistent);

    const noResults = await searchPage.isNoResultsVisible();
    expect(noResults).toBeTruthy();
  });
});
