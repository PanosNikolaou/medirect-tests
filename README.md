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

## License

MIT License\

