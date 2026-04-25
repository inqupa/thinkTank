// subsystems/logic/problem.js

document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Access Limits (Replaces the inline <head> script as well)
    fetch('/api/problems/access', { method: 'GET' })
        .then(async (res) => {
            if (res.status === 403) {
                // Backend enforced the 10-view limit. Redirect to register.
                alert(
                    "You've viewed the problem registry 10 times. Please register to continue as a Solver."
                );
                window.location.href = '/skeleton/auth_placeholder.html';
                return;
            }

            const data = await res.json();

            // Handle Suggestion Box
            const isDismissed = localStorage.getItem('dismissedSuggestion');
            if (
                data.viewsLeft !== undefined &&
                data.viewsLeft <= 7 &&
                !isDismissed
            ) {
                const box = document.getElementById('suggestion-box');
                if (box) box.style.display = 'block';
            }

            // 2. Access Granted: Fetch and Render Vents
            loadAndRenderVents();
        })
        .catch((err) => console.error('Access check failed', err));

    // Suggestion Box Dismissal Logic
    const dismissBtn = document.getElementById('dismiss-suggestion');
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            localStorage.setItem('dismissedSuggestion', 'true');
            const box = document.getElementById('suggestion-box');
            if (box) box.style.display = 'none';
        });
    }
});

// The Secure Rendering Engine
async function loadAndRenderVents() {
    const feedContainer = document.getElementById('vent-feed-container');
    if (!feedContainer || !window.getVents) return;

    feedContainer.textContent = 'Loading network data...';

    const vents = await window.getVents();
    feedContainer.textContent = ''; // Clear loading text

    if (vents.length === 0) {
        feedContainer.textContent = 'No vents found.';
        return;
    }

    // XSS Protection: We create elements dynamically and use .textContent
    // This guarantees the browser treats input as raw text, never as executable HTML/JS.
    vents.forEach((vent) => {
        // Skip quarantined test data unless we are in God Mode
        if (
            vent.is_test === 1 &&
            !document.cookie.includes('vent_godmode=true')
        ) {
            return;
        }

        const card = document.createElement('div');
        card.className = 'vent-card'; // Replaced inline CSS!

        const dateHeader = document.createElement('small');
        dateHeader.className = 'vent-date-header'; // Replaced inline CSS!

        // Parse date securely
        dateHeader.textContent = new Date(vent.created_at).toLocaleString(
            'en-US',
            {
                month: 'long',
                year: 'numeric',
                day: 'numeric'
            }
        );

        if (vent.is_test === 1) {
            dateHeader.textContent += ' [TEST DATA]';
            dateHeader.classList.add('vent-test-data'); // Replaced inline CSS!
        }

        const contentBody = document.createElement('p');
        contentBody.className = 'vent-content-body'; // Replaced inline CSS!
        contentBody.textContent = vent.content; // Strict XSS protection

        card.appendChild(dateHeader);
        card.appendChild(contentBody);
        feedContainer.appendChild(card);
    });
}
