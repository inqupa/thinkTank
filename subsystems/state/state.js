let saveTimeout = null;
// 1. Try to load existing state from the hard drive first
const savedState = localStorage.getItem('vent_app_state');
const parsedState = savedState ? JSON.parse(savedState) : {};

// 2. Define initialState, merging saved data if it exists
let initialState = {
    user: { name: '', bio: '', email: '', ...(parsedState.user || {}) },
    ui: {
        theme: 'light',
        dismissedSuggestion: false,
        ...(parsedState.ui || {})
    },
    data: { visitCount: 0, ...(parsedState.data || {}) },
    subscribers: []
};

// FIX: Always re-attach the empty subscribers array on every page load
// because it cannot be (and was not) saved to localStorage.
initialState.subscribers = [];

// 3. Create the Proxy immediately
window.appState = createPersistentState(initialState);

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
            console.error('Failed to load state snapshot:', e);
        }
    }
}

function updateUI(prop, val) {
    if (prop === 'theme') {
        // Ensure document.documentElement is used for global data-theme attribute
        if (val === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    // Existing logic for other signals...
    const elements = document.querySelectorAll(`[id^="sig-${prop}"]`);
    elements.forEach((el) => {
        el.textContent = val;
    });
}

// --- NEW DEBOUNCE LOGIC ---
function debouncedSaveState() {
    // Clear the previous timeout if it exists
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    // Set a new timeout to save after 2 seconds (2000 ms) of inactivity
    saveTimeout = setTimeout(() => {
        if (!window.appState) return;

        const stateToSave = {
            user: window.appState.user,
            ui: window.appState.ui,
            data: window.appState.data
        };

        try {
            localStorage.setItem('vent_app_state', JSON.stringify(stateToSave));
            console.log(
                'Phase 1 Security: State securely saved to localStorage (debounced)'
            );
        } catch (e) {
            console.error(
                'Failed to save state. Storage quota may be exceeded.',
                e
            );
        }
    }, 2000);
}
// --------------------------

function createPersistentState(state) {
    const MAX_DEPTH = 3; // Prevent overly deep nested state

    function buildProxy(targetObj, currentDepth) {
        // Structural Check 1: Prevent infinite proxy chains
        if (currentDepth > MAX_DEPTH) {
            console.warn(
                `Phase 2: State depth exceeded ${MAX_DEPTH} levels. Returning raw object.`
            );
            return targetObj;
        }

        const handler = {
            get(target, property) {
                const value = target[property];
                // Don't proxy the subscribers array or internal DOM nodes if they sneak in
                if (
                    value &&
                    typeof value === 'object' &&
                    property !== 'subscribers' &&
                    !Array.isArray(value)
                ) {
                    return buildProxy(value, currentDepth + 1);
                }
                return value;
            },
            set(target, property, value) {
                // Structural Check 2: The Idempotency Check (Prevents Infinite Loops)
                // Only trigger subscribers and save if the value ACTUALLY changed
                if (target[property] === value) {
                    return true;
                }

                target[property] = value;

                // Phase 2.3: Improved Broadcast Logic
                if (window.appState && window.appState.subscribers) {
                    window.appState.subscribers.forEach((sub) => {
                        if (
                            sub.key === property ||
                            sub.key === '*' ||
                            sub.key === 'user' ||
                            sub.key === 'data' ||
                            sub.key === 'ui' ||
                            property === 'theme'
                        ) {
                            try {
                                sub.callback(property, value);
                            } catch (err) {
                                console.error(
                                    'Subscriber execution failed:',
                                    err
                                );
                            }
                        }
                    });
                }

                // Call the debounced save mechanism we added in Phase 1
                debouncedSaveState();
                window.dispatchEvent(new Event('stateChange'));
                return true;
            }
        };
        return new Proxy(targetObj, handler);
    }

    return buildProxy(state, 1);
}

// Time-Based Auto-Detection
function applyTimeTheme() {
    // Only auto-suggest if no manual theme is saved yet
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = hour < 6 || hour > 18 ? 'dark' : 'light';
        window.appState.ui.theme = suggestedTheme;
    }
}

// Enhanced Selective Subscription Helper
window.subscribeToState = (key, callback) => {
    if (typeof callback === 'function') {
        // Store the callback along with the key it cares about
        window.appState.subscribers.push({ key, callback });
        console.log(`Phase 1.3: Registered selective subscriber for [${key}]`);
    }
};

async function startStateSystem() {
    // Load defaults asynchronously
    await loadInitialState();

    // Register core theme subscribers
    window.subscribeToState('theme', (prop, val) => {
        updateUI(prop, val);
    });

    // PERSISTENCE FIX: Apply the current theme immediately
    // Access the live value from your namespaced state
    const currentTheme =
        window.appState.ui.theme || localStorage.getItem('theme');
    if (currentTheme) {
        updateUI('theme', currentTheme);
    }

    // 5. Run auto-detection
    applyTimeTheme();

    console.log('Phase 1.1: State System Populated');
}

// Start the loading process
startStateSystem();
