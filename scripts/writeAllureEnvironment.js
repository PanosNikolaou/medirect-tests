const fs = require('fs');
const path = require('path');
const { chromium, firefox, webkit } = require('@playwright/test');

(async function writeAllureEnvironment() {
  try {
    const envDir = path.resolve('allure-results');
    if (!fs.existsSync(envDir)) fs.mkdirSync(envDir, { recursive: true });

    const browsers = {
      chromium: (await chromium.launch()).version(),
      firefox: (await firefox.launch()).version(),
      webkit: (await webkit.launch()).version(),
    };

    // Close browsers immediately after getting version
    await Promise.all([chromium.launch().then(b => b.close()), firefox.launch().then(b => b.close()), webkit.launch().then(b => b.close())]);

    const envContent = [
      `Node=${process.version}`,
      `Chromium=${browsers.chromium}`,
      `Firefox=${browsers.firefox}`,
      `WebKit=${browsers.webkit}`,
      `CI=${process.env.CI || 'false'}`,
      `Executor=${process.env.GITHUB_RUN_ID || 'local-run'}`,
      `ExecutorType=${process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'local'}`
    ].join('\n');

    fs.writeFileSync(path.join(envDir, 'environment.properties'), envContent);
    console.log('✅ Allure environment.properties written');
  } catch (err) {
    console.error('❌ Failed to write Allure environment:', err);
    process.exit(1);
  }
})();
