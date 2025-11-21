const fs = require('fs');
const path = require('path');
const { chromium, firefox, webkit } = require('@playwright/test');

(async function writeAllureEnvironment() {
  try {
    console.log('🟢 Starting Allure environment setup...');

    const envDir = path.resolve('allure-results');
    if (!fs.existsSync(envDir)) {
      fs.mkdirSync(envDir, { recursive: true });
      console.log(`📂 Created directory: ${envDir}`);
    }

    console.log('🌐 Launching browsers to get versions...');
    const browserVersions = {};

    const chromiumBrowser = await chromium.launch();
    browserVersions.chromium = await chromiumBrowser.version();
    await chromiumBrowser.close();
    console.log(`✅ Chromium version: ${browserVersions.chromium}`);

    const firefoxBrowser = await firefox.launch();
    browserVersions.firefox = await firefoxBrowser.version();
    await firefoxBrowser.close();
    console.log(`✅ Firefox version: ${browserVersions.firefox}`);

    const webkitBrowser = await webkit.launch();
    browserVersions.webkit = await webkitBrowser.version();
    await webkitBrowser.close();
    console.log(`✅ WebKit version: ${browserVersions.webkit}`);

    const envContent = [
      `Node=${process.version}`,
      `Chromium=${browserVersions.chromium}`,
      `Firefox=${browserVersions.firefox}`,
      `WebKit=${browserVersions.webkit}`,
      `CI=${process.env.CI || 'false'}`,
      `Executor=${process.env.GITHUB_RUN_ID || 'local-run'}`,
      `ExecutorType=${process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'local'}`
    ].join('\n');

    const envFile = path.join(envDir, 'environment.properties');
    fs.writeFileSync(envFile, envContent);
    console.log(`✅ Allure environment.properties written at ${envFile}`);
  } catch (err) {
    console.error('❌ Failed to write Allure environment:', err);
    process.exit(1);
  }
})();
