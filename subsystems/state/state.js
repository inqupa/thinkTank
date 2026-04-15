// Replace the hard-coded initialState declaration
let initialState = {
    user: {}, ui: {}, data: {}, subscribers: []
};

async function loadInitialState() {
    const saved = localStorage.getItem('app_state_exists');
    if (!saved) {
        try {
            const response = await fetch('/data/default_state.json');
            const defaults = await response.json();
            // Deep merge defaults into initialState
            Object.assign(initialState.user, defaults.user);
            Object.assign(initialState.ui, defaults.ui);
            Object.assign(initialState.data, defaults.data);
            localStorage.setItem('app_state_exists', 'true');
        } catch (e) {
            console.error("Failed to load state snapshot:", e);
        }
    }
}

// Ensure window.appState is created only after fetching defaults
loadInitialState().then(() => {
    window.appState = createPersistentState(initialState);
    applyTimeTheme();
});

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

function createPersistentState(state) {
    const handler = {
        get(target, property) {
            const value = target[property];
            if (value && typeof value === 'object' && property !== 'subscribers') {
                // Pass a reference to the namespace name (e.g., 'user') to the child proxy
                return new Proxy(value, handler);
            }
            return value;
        },
        set(target, property, value) {
            target[property] = value;

            // Phase 2.3: Improved Broadcast Logic
            if (window.appState && window.appState.subscribers) {
                window.appState.subscribers.forEach(sub => {
                    // This checks if the changed property matches the subscriber's key
                    // OR if the subscriber is watching the parent namespace
                    if (sub.key === property || sub.key === '*' || sub.key === 'user' || property === 'theme') {
                        try {
                            sub.callback(property, value);
                        } catch (err) {
                            console.error("Subscriber execution failed:", err);
                        }
                    }
                });
            }

            window.dispatchEvent(new Event('stateChange'));
            return true;
        }
    };
    return new Proxy(state, handler);
}

// Time-Based Auto-Detection
function applyTimeTheme() {
    // Only auto-suggest if no manual theme is saved yet
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = (hour < 6 || hour > 18) ? "dark" : "light";
        window.appState.ui.theme = suggestedTheme;
    }
}

// Phase 1.3: Enhanced Selective Subscription Helper
window.subscribeToState = (key, callback) => {
    if (typeof callback === 'function') {
        // Store the callback along with the key it cares about
        window.appState.subscribers.push({ key, callback });
        console.log(`Phase 1.3: Registered selective subscriber for [${key}]`);
    }
};

window.appState = createPersistentState(initialState);

window.subscribeToState('theme', (prop, val) => {
    updateUI(prop, val); // needed to change theme when user clicks a button
});

// Keep your time-based auto-detection
applyTimeTheme();