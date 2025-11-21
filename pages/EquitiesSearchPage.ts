import { BasePage } from './BasePage';
import { Page, JSHandle } from '@playwright/test';

type SearchContext =
  | { kind: 'shadow'; rootHandle: JSHandle }
  | { kind: 'css'; selector: string };

export class EquitiesSearchPage extends BasePage {
  page: Page;
  searchComponent = 'md-stock-search-list';
  lastSearchTerm: string | null = null;

  constructor(page: Page) {
    super(page);
    this.page = page;
  }

  // Return either the shadowRoot handle for the custom element or a CSS selector for a normal input container
  private async getSearchContext(): Promise<SearchContext> {
    // Try the custom element first (it may not exist anymore)
    const elHandle = await this.page.$(this.searchComponent);
    if (elHandle) {
      const shadowRootHandle = await this.page.evaluateHandle((selector) => {
        const el = document.querySelector(selector) as HTMLElement | null;
        return el ? (el.shadowRoot ?? null) : null;
      }, this.searchComponent);
      if (shadowRootHandle) return { kind: 'shadow', rootHandle: shadowRootHandle };
    }

    // Fallback: try to find a visible input with a known placeholder or label
    const fallbackSelectors = [
      'input[placeholder*="Enter name"]',
      'input[placeholder*="name, ISIN"]',
      'input[aria-label*="Enter name"]',
      'input[type="search"]',
      'input'
    ];

    for (const sel of fallbackSelectors) {
      try {
        const locator = this.page.locator(sel).first();
        if (await locator.count() && await locator.isVisible({ timeout: 1000 })) {
          return { kind: 'css', selector: sel };
        }
      } catch (e) {
        // ignore and try next
      }
    }

    // As last resort, return the custom selector (tests will fail later with clearer error)
    return { kind: 'css', selector: this.searchComponent };
  }

  async searchEquity(name: string) {
    this.lastSearchTerm = name;
    const context = await this.getSearchContext();

    if (context.kind === 'shadow') {
      const root = context.rootHandle;
      // Type into input inside shadow root
      await this.page.evaluate((root: any, value: string) => {
        const input = (root as Element).querySelector('input') as HTMLInputElement | null;
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, root, name);

      // Click search button if exists in shadow
      await this.page.evaluate((root: any) => {
        const btn = (root as Element).querySelector('button[type="submit"]') as HTMLButtonElement | null;
        if (btn) btn.click();
      }, root);

      // Wait inside shadow root for either results or a no-results marker
      const end = Date.now() + 5000;
      while (Date.now() < end) {
        const found = await this.page.evaluate((r: any) => {
          const rootEl = r as Element | ShadowRoot;
          if (rootEl.querySelector('.no-results')) return true;
          const items = rootEl.querySelectorAll('.search-result-item');
          return items.length > 0;
        }, root).catch(() => false);
        if (found) break;
        await this.page.waitForTimeout(250);
      }
      return;
    } else {
      // Regular DOM fallback
      try {
        const locator = this.page.locator(context.selector).first();
        await locator.fill(name, { timeout: 3000 });
        // Press Enter on the specific input to trigger search
        await locator.press('Enter');
      } catch (e) {
        // Last-resort: fill any visible input
        const visibleInput = this.page.locator('input:visible').first();
        if (await visibleInput.count()) {
          try { await visibleInput.fill(name, { timeout: 2000 }); await visibleInput.press('Enter'); } catch (e) { }
        }
      }
    }

    // For regular DOM, wait for either results or a no-results marker (avoid fixed sleep)
    const checks = [
      this.page.waitForSelector('.search-result-item', { timeout: 3000 }).catch(() => null),
      this.page.waitForSelector('.no-results', { timeout: 3000 }).catch(() => null),
      this.page.waitForSelector('table tr', { timeout: 3000 }).catch(() => null),
    ];
    await Promise.race(checks);
  }

  async getResultsCount(): Promise<number> {
    const context = await this.getSearchContext();
    if (context.kind === 'shadow') {
      return this.page.evaluate((root: any) => (root.querySelectorAll('.search-result-item') || []).length, context.rootHandle);
    }

    // For regular DOM, try to count rows/buttons in the results table
    try {
      const rows = await this.page.locator('table tr').count();
      // subtract header row if present
      return Math.max(0, rows - 1);
    } catch (e) {
      return 0;
    }
  }

  async isNoResultsVisible(): Promise<boolean> {
    const context = await this.getSearchContext();
    if (context.kind === 'shadow') {
      // If we have a lastSearchTerm, check whether any result contains that term (case-insensitive).
      if (this.lastSearchTerm) {
        const foundForTerm = await this.page.evaluate((root: any, term: string) => {
          const r = root as Element;
          const items = Array.from(r.querySelectorAll('.search-result-item')) as Element[];
          return items.some(it => (it.textContent || '').toLowerCase().includes(term.toLowerCase()));
        }, context.rootHandle, this.lastSearchTerm).catch(() => false);
        return !foundForTerm;
      }

      // Otherwise, check for explicit no-results element or zero result items
      const hasNoResults = await this.page.evaluate((root: any) => {
        const r = root as Element;
        if (r.querySelector('.no-results')) return true;
        const items = r.querySelectorAll('.search-result-item');
        return items.length === 0;
      }, context.rootHandle);
      return !!hasNoResults;
    }

    // Regular DOM: check for common markers
    try {
      if (await this.page.isVisible('.no-results').catch(() => false)) return true;
      if ((await this.page.locator('text=No results').count()) > 0) return true;

      // If we have a lastSearchTerm, check whether any table/rows contain it.
      if (this.lastSearchTerm) {
        const rows = this.page.locator('table tr');
        const count = await rows.count().catch(() => 0);
        let matches = 0;
        for (let i = 0; i < count; i++) {
          const row = rows.nth(i);
          const text = (await row.textContent()) || '';
          if (text.toLowerCase().includes(this.lastSearchTerm.toLowerCase())) matches++;
        }
        return matches === 0 ? true : false;
      }

      // Table with only header is likely no results
      const rows = await this.page.locator('table tr').count().catch(() => 0);
      if (rows <= 1) return true;
      return false;
    } catch (e) {
      return false;
    }
  }

  // Click the first "More information" / result button (works for shadow and DOM fallbacks)
  async clickFirstMoreInfo() {
    const context = await this.getSearchContext();
    if (context.kind === 'shadow') {
      await this.page.evaluate((root: any) => {
        const btn = (root as Element).querySelector('.search-result-item button') as HTMLButtonElement | null;
        if (btn) btn.click();
      }, context.rootHandle);
    } else {
      // Try table buttons first
      const btn = this.page.locator('button:has-text("More information")').first();
      if (await btn.count()) {
        try { await btn.click(); } catch (e) { }
        return;
      }

      // fallback: first result-like button
      const genericBtn = this.page.locator('.search-result-item button').first();
      if (await genericBtn.count()) {
        try { await genericBtn.click(); } catch (e) { }
      }
    }

    await this.page.waitForTimeout(1000);
  }

  async clickMoreInfo(equityName: string) {
    const context = await this.getSearchContext();
    if (context.kind === 'shadow') {
      await this.page.evaluate((root: any, name: string) => {
        const item = Array.from((root as Element).querySelectorAll('.search-result-item')).find(el =>
          el.textContent?.includes(name)
        ) as HTMLElement | undefined;

        const btn = item?.querySelector('button') as HTMLButtonElement | null;
        if (btn) btn.click();
      }, context.rootHandle, equityName);
    } else {
      // Regular DOM: find the table row that contains the equityName and click the More information button
      const rows = this.page.locator('table tr');
      const count = await rows.count();
      for (let i = 0; i < count; i++) {
        const row = rows.nth(i);
        if ((await row.textContent())?.includes(equityName)) {
          const btn = row.locator('button:has-text("More information")');
          if (await btn.count()) {
            await btn.first().click();
            break;
          }
        }
      }
    }

    await this.page.waitForTimeout(1000);
  }
}