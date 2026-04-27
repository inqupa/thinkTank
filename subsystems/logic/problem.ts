// subsystems/logic/problem.ts

// TS FIX: This empty export forces TypeScript to treat this file as a module,
// which allows us to safely use 'declare global' below!
export {};

// --- TYPE DEFINITIONS ---
interface AccessResponse {
    viewsLeft?: number;
    requireAuth?: boolean;
    access?: string;
    [key: string]: any;
}

interface VentRecord {
    content: string;
    created_at: string;
    is_test?: number;
    [key: string]: any;
}

declare global {
    interface Window {
        getVents?: () => Promise<VentRecord[]>;
    }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Check Access Limits
    fetch('/api/problems/access', { method: 'GET' })
        .then(async (res: Response) => {
            if (res.status === 403) {
                // Backend enforced the limit. Redirect to register.
                alert(
                    "You've viewed the problem registry limit. Please register to continue as a Member."
                );
                window.location.href = '/skeleton/auth_placeholder.html';
                return;
            }

            const data: AccessResponse = await res.json();

            // Handle Suggestion Box
            const isDismissed = localStorage.getItem('dismissedSuggestion');
            if (
                data.viewsLeft !== undefined &&
                data.viewsLeft <= 7 &&
                !isDismissed
            ) {
                const box = document.getElementById('suggestion-box') as HTMLElement | null;
                if (box) box.style.display = 'block';
            }

            // 2. Access Granted: Fetch and Render Vents
            loadAndRenderVents();
        })
        .catch((err: any) => console.error('Access check failed', err));

    // Suggestion Box Dismissal Logic
    const dismissBtn = document.getElementById('dismiss-suggestion') as HTMLButtonElement | null;
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            localStorage.setItem('dismissedSuggestion', 'true');
            const box = document.getElementById('suggestion-box') as HTMLElement | null;
            if (box) box.style.display = 'none';
        });
    }
});

// --- CORE RENDERING ENGINE ---
async function loadAndRenderVents(): Promise<void> {
    const feedContainer = document.getElementById('vent-feed-container') as HTMLElement | null;
    if (!feedContainer || !window.getVents) return;

    feedContainer.textContent = 'Loading network data...';

    const vents = await window.getVents();
    feedContainer.textContent = ''; // Clear loading text

    if (vents.length === 0) {
        feedContainer.textContent = 'No vents found.';
        return;
    }

    vents.forEach((vent: VentRecord) => {
        // Skip quarantined test data unless we are in God Mode
        if (
            vent.is_test === 1 &&
            !document.cookie.includes('vent_godmode=true')
        ) {
            return;
        }

        const card = document.createElement('div');
        card.className = 'vent-card'; 

        const dateHeader = document.createElement('small');
        dateHeader.className = 'vent-date-header'; 

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
            dateHeader.classList.add('vent-test-data'); 
        }

        const contentBody = document.createElement('p');
        contentBody.className = 'vent-content-body'; 
        contentBody.textContent = vent.content; 

        card.appendChild(dateHeader);
        card.appendChild(contentBody);
        feedContainer.appendChild(card);
    });
}