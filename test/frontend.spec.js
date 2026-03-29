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

        // Fill host and user
        await page.fill('#host', '192.168.1.100');
        await page.fill('#user', 'admin');

        // Connect button should be enabled
        const startBtn = page.locator('#start');
        await expect(startBtn).toBeEnabled();
    });
});
