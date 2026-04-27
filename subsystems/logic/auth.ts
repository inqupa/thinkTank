interface MagicLinkResponse {
    error?: string;
    message?: string;
    [key: string]: any;
}

document.addEventListener('DOMContentLoaded', () => {
    const emailInput = document.getElementById('email') as HTMLInputElement | null;
    const authBtn = document.querySelector('button[type="submit"]') as HTMLButtonElement | null;
    const form = document.querySelector('form') as HTMLFormElement | null;

    if (emailInput && authBtn && form) {
        // Email Input Dynamic Styling
        emailInput.addEventListener('input', (e: Event) => {
            const target = e.target as HTMLInputElement;
            const value = target.value.trim();

            if (value.includes('@') && value.length > 5) {
                authBtn.textContent = 'Secure Your Access';
                authBtn.style.filter = 'brightness(1.1)';
                authBtn.style.transform = 'scale(1.02)';
            } else {
                authBtn.textContent = 'Get Magic Link';
                authBtn.style.filter = 'brightness(1.0)';
                authBtn.style.transform = 'scale(1.0)';
            }
        });

        // Form Submission
        form.addEventListener('submit', async (e: Event) => {
            e.preventDefault();

            const email = emailInput.value.trim();
            if (!email) return;

            const originalText = authBtn.textContent || 'Get Magic Link';
            authBtn.textContent = 'Sending...';
            authBtn.disabled = true;

            try {
                const response = await fetch('/api/auth/magic-link', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email })
                });

                const data: MagicLinkResponse = await response.json();

                if (!response.ok) {
                    alert(data.error || 'Failed to send link.');
                    authBtn.textContent = originalText;
                    authBtn.disabled = false;
                    return;
                }

                authBtn.textContent = 'Check your email!';
                authBtn.style.backgroundColor = '#2a9d8f';
                authBtn.style.color = 'white';
            } catch (error: any) {
                console.error('Connection failed:', error);
                alert('Network error. Could not reach the server.');
                authBtn.textContent = originalText;
                authBtn.disabled = false;
            }
        });
    }

    // Force focus on page load
    if (emailInput) emailInput.focus();
});