# Medirect Tests

Automated Playwright test framework for the MeDirect equities search
pages with integrated Allure reporting, GitHub Pages dashboards, and
CI/CD automation.

------------------------------------------------------------------------

## Key Features

-   Playwright + TypeScript end-to-end testing
-   Shadow DOM handling & resilient selectors
-   Automatic screenshots & traces on failures
-   Allure test reporting with history & trends
-   GitHub Pages live dashboard
-   CI automation via GitHub Actions
-   Persistent storage state for cookies

------------------------------------------------------------------------

## Live Reporting

Reports are automatically published on every CI run.

- Live dashboard (root index): https://panosnikolaou.github.io/medirect-tests/
- Playwright HTML Report (index): https://panosnikolaou.github.io/medirect-tests/playwright-reports/latest/index.html
- Allure Report (index): https://panosnikolaou.github.io/medirect-tests/allure-reports/latest/index.html

### Allure Reports

-   Latest (master):
    https://`<your-username>`{=html}.github.io/`<your-repo>`{=html}/allure-reports/latest
-   Branch-based:
    https://`<your-username>`{=html}.github.io/`<your-repo>`{=html}/allure-reports/`<branch-name>`{=html}

### Playwright HTML Reports

-   Latest (master):
    https://`<your-username>`{=html}.github.io/`<your-repo>`{=html}/playwright-reports/latest

------------------------------------------------------------------------

## Repository Structure

    .
    ├── tests/
    │   └── searchEquities.spec.ts
    ├── pages/
    │   ├── BasePage.ts
    │   ├── EquitiesSearchPage.ts
    │   └── EquityDetailsPage.ts
    ├── scripts/
    │   ├── writeAllureEnvironment.js
    │   └── generate-index-html.sh
    ├── .github/workflows/
    │   └── ci-playwright.yml
    └── playwright.config.ts

------------------------------------------------------------------------

## Quick Setup

Install dependencies:

``` bash
npm install
```

Install Playwright browsers:

``` bash
npx playwright install
```

------------------------------------------------------------------------

## Running Tests

### Full suite (headed)

``` bash
npx playwright test --headed
```

### Full suite (headless / CI-style)

``` bash
npx playwright test
```

### Single test file

``` bash
npx playwright test tests/searchEquities.spec.ts --headed
```

### Single test by name

``` bash
npx playwright test -g "Search for a non-existent equity" --headed
```

------------------------------------------------------------------------

## NPM Scripts

    npm run test        # headless
    npm run test:headed # headed mode
    npm run report:open # open Playwright HTML report
    npm run ci          # CI execution mode

------------------------------------------------------------------------

## Passing an Equity Name

Supported via:

### Environment Variable

``` bash
EQUITY_NAME=FOO_BAR_NOT_REAL npm run test
```

### CLI Argument

``` bash
npx playwright test -g "Search for a non-existent equity" -- --equity=FOO_BAR_NOT_REAL
```

If not supplied, a random non-existent equity name is generated
automatically.

------------------------------------------------------------------------

## Screenshots & Traces

On failure:

-   Full-page screenshots stored in: test-results/screenshots/

-   Traces stored in: test-results/traces/

Filename example:

    NON_EXISTENT_1698501234567.png

------------------------------------------------------------------------

## Cookie Persistence

Recommended for CI:

1.  Accept cookies once manually & save state:

``` ts
await context.storageState({ path: 'state.json' });
```

2.  Configure Playwright:

``` ts
test.use({ storageState: 'state.json' });
```

------------------------------------------------------------------------

## Debugging

-   Run visually:

``` bash
npx playwright test --debug
```

-   Pause execution:

``` bash
PWDEBUG=1 npx playwright test
```

------------------------------------------------------------------------

## CI & GitHub Actions

Workflow file: `.github/workflows/ci-playwright.yml`

### What it does:

-   Runs on:
    -   push / pull_request to master
    -   manual trigger
    -   daily schedule (06:00 UTC)
-   Executes Playwright tests
-   Generates Allure + Playwright reports
-   Publishes reports to GitHub Pages
-   Preserves Allure history
-   Forces gh-pages update every run

Artifacts uploaded: - playwright-report - allure-report

------------------------------------------------------------------------

## Report Refresh Logic

-   master = actual branch report
-   latest = always points to newest master run

This ensures: - Stable permalink - CI-friendly dashboards - Historical
tracking

------------------------------------------------------------------------

## Troubleshooting

  Problem              Solution
  -------------------- --------------------------------------------
  No tests found       Check playwright.config.ts
  TypeScript errors    Run `npx tsc --noEmit`
  CORS error locally   Serve using `npx serve` instead of file://

------------------------------------------------------------------------

## Local Viewing of Allure

Never open directly via file://

Use:

``` bash
npx allure serve allure-results
```

or

``` bash
npx serve allure-report
```

------------------------------------------------------------------------

## Best Practices

-   Prefer data-testid selectors
-   Avoid hard sleeps
-   Use explicit waits
-   Keep tests deterministic

------------------------------------------------------------------------

## Writing New Tests & Extending the Page Object Model

This section explains how to add new Playwright tests to the repo and how to extend
the project's Page Object Model (POM) by adding new page classes that reuse common
helpers defined in `pages/BasePage.ts`.

Overview (contract):
- Inputs: test file name, optional CLI args or env vars (e.g. `--equity`, `EQUITY_NAME`)
- Outputs: Playwright test results, HTML report, Allure results
- Error modes: selector changes, flaky network, missing fixtures

Best practices before you start:
- Use `data-testid` attributes for stable selectors where possible.
- Prefer explicit waits (expect/locator.waitFor) over fixed sleeps.
- Keep tests small and focused (1 logical assertion per test).
- Reuse POM methods for UI interactions.

A) Create a new test file

1. Add a new file under `tests/` with a descriptive name, e.g.:

```ts
// tests/searchBySymbol.spec.ts
import { test, expect } from '@playwright/test';
import { EquitiesSearchPage } from '../pages/EquitiesSearchPage';

// Use Playwright fixtures (the `page` fixture is provided by the test runner)
test('search by ticker symbol returns correct result', async ({ page }) => {
  const searchPage = new EquitiesSearchPage(page);

  // Navigate to the page under test using a POM helper
  await searchPage.goto();

  // Perform the search using the POM
  await searchPage.searchFor('MEDE');

  // Assert the expected behavior
  await expect(searchPage.firstResult()).toContainText('MeDirect');
});
```

2. Naming and grouping:
- Use `.spec.ts` suffix for test files.
- Use `test.describe()` to group related tests and `test.beforeEach()` to share setup.

3. Running the test locally:

```bash
# Run the single test file
npx playwright test tests/searchBySymbol.spec.ts --headed

# Run a single test by name (grep)
npx playwright test -g "search by ticker symbol"
```

B) Extending the Page Object Model (POM)

1. Create a new page class in the `pages/` directory. Keep it small and focused.
- Import `BasePage` and extend it so you reuse shared helpers (navigation, wait helpers, logger).
- Accept Playwright's `Page` object in the constructor and call `super(page)`.

Example:

```ts
// pages/MyNewPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MyNewPage extends BasePage {
  readonly searchInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByTestId('search-input');
    this.submitButton = page.getByTestId('search-submit');
  }

  async goto() {
    await this.page.goto('/');
  }

  async searchFor(term: string) {
    await this.searchInput.fill(term);
    await this.submitButton.click();
    // Use BasePage helper (if available) to wait for navigation or busy indicator
    await this.waitForNetworkIdle();
  }

  firstResult() {
    return this.page.getByTestId('result-0');
  }
}
```

2. Use consistent locator strategy:
- Prefer `page.getByTestId('...')`, `page.getByRole(...)`, or semantic locators over brittle CSS/XPath.
- Keep all selectors in the page class so tests remain readable and resilient.

3. Re-use BasePage helpers where appropriate (timeouts, logging, wait helpers).
If the BasePage doesn't yet expose something useful, add a small, well-documented
helper there and use it across page classes.

C) Adding test data / fixtures

- Use environment variables (documented at the top of this README) for simple config.
- For more complex or repeatable fixtures, create helper files under `tests/helpers`.
- If you need to persist auth state, use the existing `scripts/capture-storage-state.ts`
  to generate `state.json` and the runner will reuse it via the `STORAGE_STATE` env.

D) CI / Allure integration notes

- When you add new tests, ensure they don't rely on unstable environment-specific data.
- All test results are automatically gathered into `allure-results` and a report is
  generated in the CI job. To preview Allure locally after a run, use:

```bash
npx allure serve allure-results
# or serve the generated report
npx serve allure-report
```

E) Example checklist when adding a new test
- [ ] Add test file under `tests/` with a descriptive name
- [ ] Add/extend a page class in `pages/` if interacting with a new screen
- [ ] Prefer `data-testid` selectors and add them to the app when possible
- [ ] Run tests locally in headed mode to visually confirm behavior
- [ ] Run `npm run ci` locally to ensure the CI script passes
- [ ] Open a PR and verify the Playwright CI workflow uploads the reports

F) Edge cases & troubleshooting
- Empty selectors: double-check test IDs and use `page.pause()` or `--debug` to inspect.
- Flaky tests: add retries in the Playwright config or stabilize selectors/waits.
- Allure history missing: when deploying reports, the Pages job expects previous
  `gh-pages` history; the workflow is resilient but keep an eye on trend data.

------------------------------------------------------------------------

## License

MIT License
