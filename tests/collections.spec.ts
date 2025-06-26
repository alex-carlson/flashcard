// write playwright tests for fetching data using the function in /lib/collections.js

import { test, expect } from '@playwright/test';
import { fetchCollections } from '../src/lib/api/collections.js';

test.describe('Collections API', () => {
    test('fetches collections successfully', async ({ request }) => {
        const response = await fetchCollections(request);
        expect(response.status()).toBe(200);
        const data = await response.json();
        expect(data).toBeInstanceOf(Array);
        expect(data.length).toBeGreaterThan(0);
        expect(data[0]).toHaveProperty('id');
        expect(data[0]).toHaveProperty('name');
    });

    test('handles error when fetching collections', async ({ request }) => {
        // Simulate an error by providing an invalid endpoint
        const response = await request.get('/invalid-endpoint');
        expect(response.status()).toBe(404);
    });
});