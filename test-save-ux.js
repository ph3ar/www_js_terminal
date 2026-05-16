const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  // Mock socket.io request
  await page.route('**/socket.io.js', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.io = function() { return { on: function(){}, emit: function(){} }; };'
  }));

  // Inject mocks for window.store and window.hterm as advised by memory
  await page.addInitScript(() => {
    window.store = {
      get: () => ({}),
      set: () => { console.log('store.set called'); }
    };
    window.hterm = { defaultStorage: {}, Terminal: class { decorate() {} setCursorPosition() {} setCursorVisible() {} runCommandClass() {} } };
    window.hterm.Terminal.prototype.prefs_ = { set: () => {} };
    window.lib = {
        Storage: { Local: class {} },
        init: (cb) => { if (cb) cb(); }
    };
  });

  await page.goto('file://' + process.cwd() + '/public/index.html');
  await page.waitForTimeout(1000);

  // Fill in connection details to enable save button
  await page.fill('#host', '127.0.0.1');
  await page.fill('#user', 'root');
  await page.fill('#name', 'My Connection');

  // Trigger keyup to ensure checkButtons runs
  await page.evaluate(() => {
    document.getElementById('name').dispatchEvent(new KeyboardEvent('keyup', {'key': 'a'}));
    document.getElementById('host').dispatchEvent(new KeyboardEvent('keyup', {'key': 'a'}));
  });

  let isDisabled = await page.evaluate(() => document.getElementById('save').hasAttribute('disabled'));
  console.log("Is disabled?", isDisabled);

  // Verify initial state
  let btnClass = await page.getAttribute('#save', 'class');
  let btnText = await page.innerText('#save');
  console.log("Initial state:", { class: btnClass, text: btnText.trim() });
  if (!btnClass.includes('btn-primary')) throw new Error('Expected btn-primary');

  // Click save
  await page.evaluate(() => {
    document.getElementById('save').click();
  });

  // Wait a small amount of time to allow DOM to update, but not enough for timeout
  await page.waitForTimeout(100);

  // Verify 'Saved!' state
  btnClass = await page.getAttribute('#save', 'class');
  btnText = await page.innerText('#save');
  console.log("Saved state:", { class: btnClass, text: btnText.trim() });
  if (!btnClass.includes('btn-success')) throw new Error('Expected btn-success');
  if (!btnText.includes('Saved!')) throw new Error('Expected "Saved!" text');

  // Wait for timeout to expire
  await page.waitForTimeout(1600);

  // Verify original state restored
  btnClass = await page.getAttribute('#save', 'class');
  btnText = await page.innerText('#save');
  console.log("Restored state:", { class: btnClass, text: btnText.trim() });
  if (!btnClass.includes('btn-primary')) throw new Error('Expected btn-primary restored');
  if (btnText.includes('Saved!')) throw new Error('Did not expect "Saved!" text');

  console.log("All assertions passed!");
  await browser.close();
})();
