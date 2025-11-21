import { test, expect } from '@playwright/test';
import { EquitiesSearchPage } from '../pages/EquitiesSearchPage';
import { EquityDetailsPage } from '../pages/EquityDetailsPage';

// Helper: get equity name from environment or CLI args
function getCliOrEnvEquityName(): string | null {
  if (process.env.EQUITY_NAME?.trim()) return process.env.EQUITY_NAME.trim();

  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--equity=')) {
      const v = a.split('=')[1];
      if (v?.trim()) return v.trim();
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
    const popularEquity = 'Maltacom'; // Replace with a valid equity
    await searchPage.searchEquity(popularEquity);

    // Click the requested equity or fallback to first available
    try {
      await searchPage.clickMoreInfo(popularEquity);
    } catch {
      await searchPage.clickFirstMoreInfo();
    }

    // Accept either restricted message or visible details
    const restrictedMessage = await detailsPage.getRestrictedMessage().catch(() => null);
    if (restrictedMessage) {
      expect(restrictedMessage).toContain('You are not authorized');
    } else {
      const detailsVisible = await detailsPage.isDetailsVisible();
      expect(detailsVisible).toBeTruthy();
    }
  });

  test('Search for a non-existent equity', async () => {
    const nonExistent = providedEquity || `NON_EXISTENT_${Date.now()}`;
    await searchPage.searchEquity(nonExistent);

    // Wait for either "no results" or any results (avoid timeout errors)
    const noResultsLocator = searchPage.noResultsLocator(); // ensure this returns locator('.no-results')
    const resultsLocator = searchPage.resultsLocator();     // ensure this returns locator('.search-result-item')

    await Promise.race([
      noResultsLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
      resultsLocator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
    ]);

    const noResults = await searchPage.isNoResultsVisible();
    expect(noResults).toBeTruthy();
  });
});
