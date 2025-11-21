# Medirect Tests

Small Playwright test suite for the MeDirect equities search pages.

---

## Overview

This repository contains Playwright tests written in TypeScript that exercise the MeDirect equities search UI.  
It includes automated handling of shadow DOM elements, fallback DOM selectors, and automatic screenshots on test failures.

---

## Files of Interest

- `tests/searchEquities.spec.ts` — the main test suite  
- `pages/` — page objects used by the tests (`BasePage`, `EquitiesSearchPage`, `EquityDetailsPage`)  

---

## Quick Setup

1. Install project dependencies:

```bash
npm install
```

2. Install Playwright browsers (required the first time):

```bash
npx playwright install
```

---

## Running Tests

- **Run the full test suite (headed):**

```bash
npx playwright test --headed
```

- **Run the full test suite (headless / CI):**

```bash
npx playwright test
```

- **Run a single test file (headed):**

```bash
npx playwright test tests/searchEquities.spec.ts --headed
```

- **Run a single test by title (example):**

```bash
npx playwright test -g "Search for a non-existent equity" --headed
```

---

## NPM Scripts

Convenience scripts from `package.json`:

```bash
npm run test        # headless
npm run test:headed # headed mode
npm run report:open # open the last HTML report
```

---

## Passing an Equity Name via CLI or Environment

Tests accept an equity name through:

- **Environment variable**: `EQUITY_NAME`  
- **CLI argument**: `--equity=NAME` or `--equity NAME`

If none is provided for non-existent-equity tests, a unique name like `NON_EXISTENT_<timestamp>` is generated.

**Examples:**

```bash
# via env var
EQUITY_NAME=FOO_BAR_NOT_REAL npm run test:headed -- -g "Search for a non-existent equity"

# via CLI arg (Playwright passes extra args after --)
npx playwright test -g "Search for a non-existent equity" -- --equity=FOO_BAR_NOT_REAL --headed
```

---

## Screenshots on Failure

- Any test failure automatically captures a **full-page screenshot** in:

```
test-results/screenshots/
```

- File names include the equity name and timestamp, e.g.:

```
NONEXISTENT123_1698501234567.png
```

- This helps quickly debug UI failures or missing elements.

---

## Notes and Tips

- **Cookie / consent popup:** The framework attempts to automatically click the cookie "Accept" button (`pages/BasePage.ts`). If the site changes the button text or displays it in an iframe, you may need to update this helper.

- **Persisting cookie consent between runs (recommended for CI):**
  1. Run a small script or test that navigates to the site, accepts cookies, and saves storage state to `state.json`:

  ```bash
  # example one-off
  npx playwright show-trace # optional
  # or in Playwright test:
  // await context.storageState({ path: 'state.json' });
  ```

  2. Configure Playwright to use that storage state:

  ```ts
  // example in test file or playwright.config.ts
  test.use({ storageState: 'state.json' });
  ```

- **Flaky / timing issues:**  
  Increase `waitForSelector` timeouts, make selectors more specific (`data-test-id`), and avoid fixed `waitForTimeout` sleeps.

- **Debugging visually:**  
  Use `--headed` and `--debug` or set `PWDEBUG=1` to pause on failures.

---

## Troubleshooting

- **"No tests found"**: Ensure you run from the repo root and `playwright.config.ts` exists and is configured for TypeScript tests.  
- **TypeScript errors**: Run `npx tsc --noEmit` to check for issues.  

---

## CI / GitHub Actions

Workflow: `.github/workflows/ci-playwright.yml`

**What it does:**

- Runs on pushes and PRs to `main`/`master`, supports manual runs (`workflow_dispatch`), and daily scheduled runs at 06:00 UTC.  
- Installs Node.js, dependencies, and Playwright browsers, then runs tests headless.  
- Uploads artifacts:
  - `playwright-report` (HTML report)
  - `test-results/results.json` (JSON results)

**How to use:**

1. Commit and push to GitHub.  
2. Open the **Actions** tab, select "Playwright Tests CI".  
3. After a run, download artifacts for inspection.

**Scheduling:**  
Adjust the cron expression in the workflow file to modify automatic run times.

---

## License

MIT / Open Source