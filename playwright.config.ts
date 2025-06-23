import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
    testDir: './tests',
    timeout: 30 * 1000,
    retries: 0,
    use: {
        baseURL: 'http://localhost:5173', // or your SvelteKit dev URL
        browserName: 'chromium',
        headless: true,
        trace: 'on-first-retry',
    },
    webServer: {
        command: 'npm run dev',
        port: 5173,
        reuseExistingServer: !process.env.CI,
    },
});
