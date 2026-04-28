import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We import the file here so its top-level event listener is registered
import '../../subsystems/logic/auth';

describe('Frontend Logic: Auth UI', () => {
    let emailInput: HTMLInputElement;
    let authBtn: HTMLButtonElement;
    let form: HTMLFormElement;

    beforeEach(() => {
        // 1. Build a fake DOM that matches your auth_placeholder.html structure
        document.body.innerHTML = `
            <form id="auth-form">
                <input id="email" type="email" />
                <button type="submit">Get Magic Link</button>
            </form>
        `;

        // 2. Grab references to our fake elements
        emailInput = document.getElementById('email') as HTMLInputElement;
        authBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement;
        form = document.querySelector('form') as HTMLFormElement;

        // 3. Mock the global fetch API so we don't make real network requests
        global.fetch = vi.fn();
        
        // FIX: Forcefully create a fake alert function instead of spying on it
        window.alert = vi.fn();

        // 4. Dispatch DOMContentLoaded! 
        document.dispatchEvent(new Event('DOMContentLoaded'));
    });
    
    afterEach(() => {
        // Clean up the DOM and mocks after every test
        document.body.innerHTML = '';
        vi.restoreAllMocks();
    });

    it('should focus the email input immediately on load', () => {
        expect(document.activeElement).toBe(emailInput);
    });

    it('should change button appearance when a valid-looking email is typed', () => {
        // Simulate typing a short, invalid string
        emailInput.value = 'test';
        emailInput.dispatchEvent(new Event('input'));
        
        // Button should remain unchanged
        expect(authBtn.textContent).toBe('Get Magic Link');

        // Simulate typing a longer string with an '@'
        emailInput.value = 'test@example.com';
        emailInput.dispatchEvent(new Event('input'));

        // Button should update dynamically
        expect(authBtn.textContent).toBe('Secure Your Access');
        expect(authBtn.style.transform).toBe('scale(1.02)');
    });

    it('should handle a successful form submission', async () => {
        // Tell our fake 'fetch' to return a successful response
        vi.mocked(global.fetch).mockResolvedValue({
            ok: true,
            json: async () => ({ message: 'Check your email for the login link!' })
        } as any);

        emailInput.value = 'user@example.com';
        
        // Simulate the user clicking submit
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Verify the button text changes immediately to 'Sending...'
        expect(authBtn.textContent).toBe('Sending...');
        expect(authBtn.disabled).toBe(true);

        // Verify fetch was called with the right URL and payload
        expect(global.fetch).toHaveBeenCalledTimes(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/auth/magic-link', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'user@example.com' })
        }));

        // Wait for the async fetch to resolve and check the final success state
        await vi.waitFor(() => {
            expect(authBtn.textContent).toBe('Check your email!');
            expect(authBtn.style.color).toBe('white');
        });
    });

    it('should handle server errors gracefully', async () => {
        // Tell our fake 'fetch' to simulate a 429 Rate Limit error
        vi.mocked(global.fetch).mockResolvedValue({
            ok: false,
            json: async () => ({ error: 'Please wait 60 seconds before requesting another link.' })
        } as any);

        emailInput.value = 'spam@example.com';
        form.dispatchEvent(new Event('submit', { cancelable: true }));

        // Wait for the async fetch to resolve and handle the error
        await vi.waitFor(() => {
            // Ensure the alert was triggered with the server's error message
            expect(window.alert).toHaveBeenCalledWith('Please wait 60 seconds before requesting another link.');
            
            // Ensure the button reset to its normal state so the user can try again later
            expect(authBtn.disabled).toBe(false);
            expect(authBtn.textContent).toBe('Get Magic Link');
        });
    });
});