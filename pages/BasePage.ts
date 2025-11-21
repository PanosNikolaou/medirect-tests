import { Page } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string) {
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
    // Try to close cookie/consent dialogs that may block interaction
    await this.closeCookieDialog();
  }

  async click(selector: string) {
    await this.page.click(selector);
  }

  async type(selector: string, text: string) {
    await this.page.fill(selector, text);
  }

  async getText(selector: string) {
    return await this.page.textContent(selector);
  }

  async isVisible(selector: string) {
    return await this.page.isVisible(selector);
  }

  async waitForSelector(selector: string, timeout = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  // Helper: attempt to close common cookie/consent dialogs (e.g., buttons labeled "Accept"/"Reject")
  async closeCookieDialog() {
    // Try several strategies to find and click an "Accept" button for cookie/consent dialogs.

    // 1) If an alertdialog appears, click its Accept button.
    try {
      const dialog = await this.page.waitForSelector('[role="alertdialog"]', { timeout: 4000 }).catch(() => null);
      if (dialog) {
        const accept = dialog.locator('button:has-text("Accept")');
        if (await accept.count()) {
          await accept.first().click({ timeout: 2000 }).catch(() => {});
          return;
        }
      }
    } catch (e) {
      // ignore
    }

    // 2) Try clicking any visible Accept button in the main frame
    try {
      const accept = this.page.locator('button:has-text("Accept")');
      if (await accept.count()) {
        for (let i = 0; i < await accept.count(); i++) {
          const btn = accept.nth(i);
          try {
            if (await btn.isVisible()) {
              await btn.click({ timeout: 2000 });
              return;
            }
          } catch (e) { /* ignore and continue */ }
        }
      }
    } catch (e) { /* ignore */ }

    // 3) Check all frames (in case the consent UI is inside an iframe)
    try {
      for (const frame of this.page.frames()) {
        try {
          const fAccept = frame.locator('button:has-text("Accept")');
          if (await fAccept.count()) {
            for (let i = 0; i < await fAccept.count(); i++) {
              const btn = fAccept.nth(i);
              try {
                if (await btn.isVisible()) {
                  await btn.click({ timeout: 2000 });
                  return;
                }
              } catch (e) { /* ignore */ }
            }
          }
        } catch (e) { /* ignore frame errors */ }
      }
    } catch (e) { /* ignore */ }

    // 4) Last-resort: evaluate in page to click by text (case-insensitive), useful if Playwright locators don't reach the element
    try {
      const clicked = await this.page.evaluate(() => {
        const text = 'accept';
        function tryClick(root: ParentNode) {
          const buttons = Array.from(root.querySelectorAll('button')) as HTMLButtonElement[];
          for (const b of buttons) {
            if ((b.innerText || b.textContent || '').toLowerCase().includes(text) && !b.disabled) {
              try { b.click(); return true; } catch (e) { }
            }
          }
          return false;
        }
        if (tryClick(document)) return true;
        const dialogs = Array.from(document.querySelectorAll('[role="alertdialog"]')) as ParentNode[];
        for (const d of dialogs) if (tryClick(d)) return true;
        return false;
      });
      if (clicked) return;
    } catch (e) { /* ignore */ }

    // If nothing worked, give a brief wait for the dialog to appear later and try once more
    const end = Date.now() + 5000;
    while (Date.now() < end) {
      try {
        const accept = this.page.locator('button:has-text("Accept")').first();
        if (await accept.count() && await accept.isVisible()) {
          await accept.click({ timeout: 2000 }).catch(() => {});
          return;
        }
      } catch (e) { /* ignore */ }
      await this.page.waitForTimeout(250);
    }
  }
}
