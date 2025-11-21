Medirect Tests
===============

Small Playwright test suite for the MeDirect equities search pages.

Overview
--------
This repository contains Playwright tests written in TypeScript that exercise the MeDirect equities search UI.

Files of interest
- `tests/searchEquities.spec.ts` — the test suite
- `pages/` — page objects used by the tests (BasePage, EquitiesSearchPage, EquityDetailsPage)

Quick setup
-----------
1. Install project dependencies (using npm):

```bash
npm install
```

2. Install Playwright browsers (required the first time):

```bash
npx playwright install
```

Running tests
-------------
- Run the full test suite (headed):

```bash
npx playwright test --headed
```

- Run the full test suite (headless / CI):

```bash
npx playwright test
```

- Run a single test file (headed):

```bash
npx playwright test tests/searchEquities.spec.ts --headed
```

- Run a single test by title (example):

```bash
npx playwright test -g "Search for a non-existent equity" --headed
```

NPM scripts
-----------
You can use the npm scripts provided in package.json for convenience:

```bash
npm run test        # headless
npm run test:headed # headed mode
npm run report:open # open the last HTML report
```

Passing an equity name to the non-existent test
------------------------------------------------
The non-existent-equity test accepts an equity name via the environment variable `EQUITY_NAME` or via a CLI arg `--equity=NAME` (or `--equity NAME`). If none is provided, the test generates a unique `NON_EXISTENT_<timestamp>` name.

Examples:

```bash
# via env var
EQUITY_NAME=FOO_BAR_NOT_REAL npm run test:headed -- -g "Search for a non-existent equity"

# via CLI arg (Playwright passes extra args after --)
npx playwright test -g "Search for a non-existent equity" -- --equity=FOO_BAR_NOT_REAL --headed
```

Notes and tips
--------------
- Cookie / consent popup: the test framework includes a helper that attempts to click the cookie "Accept" button automatically (in `pages/BasePage.ts`). If the site changes the text of that button or shows the dialog in an iframe, you may need to update the helper.

- Persisting cookie consent between runs (recommended for CI):
  1. Run a small script or test that navigates to the site, accepts cookies, and saves storage state to `state.json`:

```bash
# example (one-off)
npx playwright show-trace # (optional) 
# or create a tiny script that navigates and accepts, then:
# in Playwright: await context.storageState({ path: 'state.json' })
```

  2. Then configure Playwright to use that storage state (in `playwright.config.ts` or per-test):

```ts
// example in a test file or config
// test.use({ storageState: 'state.json' })
```

- If tests fail due to timing/flakiness: try increasing timeouts for `waitForSelector`, or make selectors more specific (data-test-id or unique IDs), and avoid fixed sleeps where possible.

- If you need to debug visually, run tests with `--headed` and use `--debug` or `PWDEBUG=1` environment variable to pause on failures.

Troubleshooting
---------------
- "No tests found": ensure you run from the repo root and that `playwright.config.ts` is present and configured for your test files (this repo uses a TypeScript Playwright config).
- If TypeScript errors appear, run `npx tsc --noEmit` to view them.
