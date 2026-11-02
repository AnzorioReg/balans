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
    await page.waitForFunction(() => typeof renderThemes === 'function' && typeof ICON_STYLES !== 'undefined');
    await page.evaluate(() => go('themes'));
    await page.waitForSelector('#v-themes.on');
    let state = await page.evaluate(() => ({
      icons: ICON_STYLES.map(x => x[0]), identities: APP_IDENTITIES.map(x => x.id),
      dark: window.localStorage.getItem('balans2.pal'),
      cards: !!document.querySelector('#cardSkinPreferences'),
      folded: [...document.querySelectorAll('#v-themes .rp-fold')].every(d => !d.open),
      levels: !!document.querySelector('.appearance-levels')?.closest('.rp-fold'),
      last: document.querySelector('#v-themes')?.lastElementChild?.dataset.rpKey
    }));
    check('Exactly four icon sets', state.icons.length === 4 && ['outline','emoji','soft','premium-solid'].every(x => state.icons.includes(x)));
    check('Exactly sixteen launcher choices', state.identities.length === 16 && state.identities[0] === 'balance');
    check('Card skin picker removed', !state.cards);
    check('Sections initially collapsed', state.folded);
    check('Brightness and contrast folded', state.levels);
    check('Chart section is last', /Графики|диаграммы/.test(state.last || ''));
    const before = await page.locator('#v-themes .rp-fold').count();
    await page.evaluate(() => { renderThemes(); renderThemes(); renderThemes(); });
    check('Repeated rendering has no duplicate sections', before === await page.locator('#v-themes .rp-fold').count());
    await page.evaluate(() => { document.querySelector('[data-icon-set="emoji"]').closest('details').open = true; });
    await page.locator('[data-icon-set="emoji"]').click();
    check('Emoji selection applied', await page.evaluate(() => state.iconSet === 'emoji'));
    await page.reload();
    await page.waitForFunction(() => typeof ICON_STYLES !== 'undefined' && ICON_STYLES.length === 4);
    check('New icon set survives restart', await page.evaluate(() => state.iconSet === 'emoji'));
    await page.evaluate(() => go('themes'));
    for (const variant of ['atelier','ribbon','stems','mosaic']) {
      await page.evaluate(id => { document.querySelector('[data-visual-set="' + id + '"]').closest('details').open = true; }, variant);
      await page.locator('[data-visual-set="' + variant + '"]').click();
      check('Chart selection ' + variant, await page.evaluate(id => state.chartSet === id, variant));
    }
    check('No JavaScript runtime errors', errors.length === 0);
    await page.screenshot({ path: 'ui-report/appearance.png', fullPage: true });
  } catch (e) {
    failure = e;
    await page.screenshot({ path: 'ui-report/failure.png', fullPage: true }).catch(() => {});
  } finally {
    fs.writeFileSync('ui-report/results.json', JSON.stringify({ checks, errors, failure: failure?.message || null }, null, 2));
    await browser.close();
  }
  if (failure) { console.error(failure); process.exitCode = 1; }
})();
