// Phase 1.1 Refactor: Implement State Namespacing
const initialState = {
    // userState namespace
    user: {
        name: "User Name",
        bio: "Short bio goes here.",
        email: "user@example.com"
    },
    // uiState namespace
    ui: {
        theme: localStorage.getItem('theme') || "light",
        dismissedSuggestion: localStorage.getItem('dismissedSuggestion') === 'true'
    },
    // dataState namespace
    data: {
        visitCount: parseInt(localStorage.getItem('visitCount')) || 0
    },
    // Phase 1.1: Create a Subscriber Registry
    subscribers: [] 
};

function updateUI(property, value) {
    if (property === "theme") {
        if (document.body) {
            document.body.setAttribute('data-theme', value);
            localStorage.setItem('theme', value);
        }
        return;
    }
    
    if (property === "visitCount") {
        localStorage.setItem('visitCount', value);
        return;
    }

    if (property === "dismissedSuggestion") {
        localStorage.setItem('dismissedSuggestion', value);
    }

    const element = document.getElementById(`sig-${property}`);
    if (element) { element.textContent = value; }
}

// subsystems/state/state.js

function createPersistentState(state) {
    const handler = {
        // The 'get' trap ensures that when you access a namespace (like .user), 
        // that namespace is also wrapped in a Proxy.
        get(target, property) {
            const value = target[property];
            if (value && typeof value === 'object' && property !== 'subscribers') {
                return new Proxy(value, handler);
            }
            return value;
        },
        set(target, property, value) {
            target[property] = value;

            // Phase 1.2 Multi-Tenant Broadcast
            // Access subscribers from the top-level appState
            if (window.appState && window.appState.subscribers) {
                window.appState.subscribers.forEach(callback => {
                    try {
                        callback(property, value);
                    } catch (err) {
                        console.error("Subscriber execution failed:", err);
                    }
                });
            }

            window.dispatchEvent(new Event('stateChange'));
            return true;
        }
    };
    return new Proxy(state, handler);
}

window.appState = createPersistentState(initialState);

// Time-Based Auto-Detection
function applyTimeTheme() {
    // Only auto-suggest if no manual theme is saved yet
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = (hour < 6 || hour > 18) ? "dark" : "light";
        window.appState.theme = suggestedTheme;
    }
}

// Global Execution on Load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateUI("theme", window.appState.theme); 
        applyTimeTheme();
    });
} else {
    updateUI("theme", window.appState.theme);
    applyTimeTheme();
}

// Helper to add new subscribers to the registry
window.subscribeToState = (callback) => {
    if (typeof callback === 'function') {
        window.appState.subscribers.push(callback);
    }
};