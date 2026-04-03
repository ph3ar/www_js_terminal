const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**/socket.io.js', route => route.fulfill({
    status: 200,
    contentType: 'application/javascript',
    body: 'window.io = function() { return { on: function(){}, emit: function(){} }; };'
  }));
  await page.goto('file://' + process.cwd() + '/public/index.html');
  await page.waitForTimeout(1000);

  // Try focusing host input, type, and press Enter
  await page.fill('#host', '127.0.0.1');
  await page.fill('#user', 'root');

  // Also dispatch keyup to trigger checkButtons
  await page.evaluate(() => {
    document.getElementById('host').dispatchEvent(new Event('keyup'));
    document.getElementById('user').dispatchEvent(new Event('keyup'));
  });

  await page.press('#user', 'Enter');

  // Wait a little for async things to happen
  await page.waitForTimeout(500);

  // Check if terminal is shown
  const terminalVisible = await page.isVisible('#terminal');
  console.log("Terminal visible after Enter:", terminalVisible);

  await browser.close();
})();
