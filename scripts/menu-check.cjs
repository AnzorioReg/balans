const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  fs.mkdirSync('ui-report', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const errors = [], checks = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = (name, value) => { checks.push({ name, passed: !!value }); assert.ok(value, name); };
  let failure;
  try {
    await page.goto('file://' + path.resolve('app/src/main/assets/index.html'));
    await page.waitForFunction(() => typeof renderTopBlock === 'function');
    await page.evaluate(() => renderTopBlock());
    await page.locator('[data-dashboard="top"]').click();
    check('Dashboard menu opens', await page.locator('#dashboardPopover').count() === 1);
    await page.keyboard.press('Escape');
    check('Dashboard menu closes', await page.locator('#dashboardPopover').count() === 0);
    await page.locator('[data-dashboard="details"]').click();
    check('Details menu opens', await page.locator('#dashboardPopover').count() === 1);
    await page.locator('.scrim.on').click({ position: { x: 10, y: 10 } });
    check('Details menu closes', await page.locator('#dashboardPopover').count() === 0);
    check('No JavaScript runtime errors', errors.length === 0);
    await page.screenshot({ path: 'ui-report/menu-check.png', fullPage: true });
  } catch (e) {
    failure = e;
    await page.screenshot({ path: 'ui-report/menu-check-failure.png', fullPage: true }).catch(() => {});
  } finally {
    fs.writeFileSync('ui-report/menu-check-results.json', JSON.stringify({ checks, errors, failure: failure?.message || null }, null, 2));
    await browser.close();
  }
  if (failure) { console.error(failure); process.exitCode = 1; }
})();
