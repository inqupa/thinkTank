import { test, expect } from '@playwright/test';

test('user can submit a vent and is redirected successfully', async ({ page }) => {
    // 1. Navigate to the local development server 
    // (Playwright will start your Vite server if configured, or you can run `npm run dev:ui` first)
    await page.goto('/'); // Adjust the port to match your Vite dev server
    
    await page.evaluate(() => {
        window.saveVent = async () => Promise.resolve();
    });

    // 2. Locate the textarea and simulate a user typing a vent
    // We use the ID 'vent-input' found in index.html
    const ventInput = page.locator('#vent-input');
    await ventInput.fill('This is an automated test vent to check system stability.');

    // 3. Locate the submit button using the ID 'submit-vent' and click it
    const submitBtn = page.locator('#submit-vent');
    await submitBtn.click();

    // 4. Verify the application logic handled the submission
    // According to home.ts, the app waits 500ms and redirects to the problem placeholder
    await expect(page).toHaveURL(/.*\/skeleton\/problem_placeholder\.html/);
});