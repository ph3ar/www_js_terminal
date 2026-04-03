const { test, expect } = require('@playwright/test');
const path = require('path');

test.describe('Frontend Tests', () => {
    test('UI Elements Function Correctly', async ({ page }) => {
        // Mock socket.io request
        await page.route('**/socket.io/socket.io.js', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/javascript',
                body: `
                    window.io = function() {
                        return {
                            on: function() {},
                            emit: function() {}
                        };
                    };
                `
            });
        });

        // Navigate to local index.html
        const indexPath = path.resolve(__dirname, '../public/index.html');
        await page.goto('file://' + indexPath);

        // Verify page title
        await expect(page).toHaveTitle(/PH3AR Terminal/);

        // Connect button should be disabled initially
        const startBtn = page.locator('#start');
        await expect(startBtn).toBeDisabled();
        await expect(startBtn).toHaveAttribute('title', 'Host and User required to connect');

        // Fill host and user
        await page.fill('#host', '192.168.1.100');
        // Need to dispatch a change/keyup event as `fill` doesn't consistently trigger `keyup` in jQuery
        await page.locator('#host').press('Tab');

        await page.fill('#user', 'admin');
        await page.locator('#user').press('Tab');

        // Let jQuery handle the events
        await page.waitForTimeout(100);

        // Connect button should be enabled
        await expect(startBtn).toBeEnabled();
        await expect(startBtn).not.toHaveAttribute('title');
    });
});
