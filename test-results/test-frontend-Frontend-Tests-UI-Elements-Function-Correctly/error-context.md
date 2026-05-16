# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: test/frontend.spec.js >> Frontend Tests >> UI Elements Function Correctly
- Location: test/frontend.spec.js:5:5

# Error details

```
Error: expect(locator).toBeDisabled() failed

Locator:  locator('#start')
Expected: disabled
Received: enabled
Timeout:  5000ms

Call log:
  - Expect "toBeDisabled" with timeout 5000ms
  - waiting for locator('#start')
    14 × locator resolved to <button id="start" class="btn btn-primary">…</button>
       - unexpected value "enabled"

```

```yaml
- button "Connect"
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | const path = require('path');
  3  | 
  4  | test.describe('Frontend Tests', () => {
  5  |     test('UI Elements Function Correctly', async ({ page }) => {
  6  |         // Mock socket.io request
  7  |         await page.route('**/socket.io/socket.io.js', async route => {
  8  |             await route.fulfill({
  9  |                 status: 200,
  10 |                 contentType: 'application/javascript',
  11 |                 body: `
  12 |                     window.io = function() {
  13 |                         return {
  14 |                             on: function() {},
  15 |                             emit: function() {}
  16 |                         };
  17 |                     };
  18 |                 `
  19 |             });
  20 |         });
  21 | 
  22 |         // Navigate to local index.html
  23 |         const indexPath = path.resolve(__dirname, '../public/index.html');
  24 |         await page.goto('file://' + indexPath);
  25 | 
  26 |         // Verify page title
  27 |         await expect(page).toHaveTitle(/PH3AR Terminal/);
  28 | 
  29 |         // Connect button should be disabled initially
  30 |         const startBtn = page.locator('#start');
> 31 |         await expect(startBtn).toBeDisabled();
     |                                ^ Error: expect(locator).toBeDisabled() failed
  32 |         await expect(startBtn).toHaveAttribute('title', 'Host and User required to connect');
  33 | 
  34 |         // Fill host and user
  35 |         await page.fill('#host', '192.168.1.100');
  36 |         // Need to dispatch a change/keyup event as `fill` doesn't consistently trigger `keyup` in jQuery
  37 |         await page.locator('#host').press('Tab');
  38 | 
  39 |         await page.fill('#user', 'admin');
  40 |         await page.locator('#user').press('Tab');
  41 | 
  42 |         // Let jQuery handle the events
  43 |         await page.waitForTimeout(100);
  44 | 
  45 |         // Connect button should be enabled
  46 |         await expect(startBtn).toBeEnabled();
  47 |         await expect(startBtn).not.toHaveAttribute('title');
  48 |     });
  49 | });
  50 | 
```