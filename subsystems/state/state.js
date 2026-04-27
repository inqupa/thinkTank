import defaultStateData from '../../public/data/default_state.json';

/**
 * @typedef {Object} UserState
 * @property {string} name - The user's name.
 * @property {string} bio - The user's biography.
 * @property {string} email - The user's email address.
 */

/**
 * @typedef {Object} UIState
 * @property {string} theme - The current UI theme ('light' or 'dark').
 * @property {boolean} dismissedSuggestion - Whether the user has dismissed the theme suggestion.
 */

/**
 * @typedef {Object} DataState
 * @property {number} visitCount - Number of times the user has visited.
 */

/**
 * @typedef {Object} AppState
 * @property {UserState} user - User-specific state data.
 * @property {UIState} ui - User interface state data.
 * @property {DataState} data - Application data state.
 * @property {Array<{key: string, callback: Function}>} subscribers - List of state change subscribers.
 */

let saveTimeout = null;
// 1. Try to load existing state from the hard drive first
const savedState = localStorage.getItem('vent_app_state');
const parsedState = savedState ? JSON.parse(savedState) : {};

// 2. Define initialState, merging saved data if it exists
/** @type {AppState} */
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

/**
 * Asynchronously loads default state data from a JSON file and merges it into the initial state
 * if no state has been saved previously.
 * @returns {Promise<void>}
 */
async function loadInitialState() {
    const saved = localStorage.getItem('app_state_exists');
    if (!saved) {
        try {
            const defaults = defaultStateData;
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

/**
 * Updates UI elements based on state changes. Specifically handles theme switching
 * and text content updates for elements with dynamic IDs.
 * @param {string} prop - The property that changed (e.g., 'theme').
 * @param {string|boolean|number} val - The new value of the property.
 */
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
/**
 * Saves the current application state to localStorage.
 * Uses a debounce mechanism to prevent excessive writes by waiting 2 seconds after the last state change.
 * @returns {void}
 */
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

/**
 * Wraps the application state in a Proxy to detect changes, trigger subscribers,
 * and initiate saves. Prevents infinitely deep proxying.
 * @param {Object} state - The raw state object to proxy.
 * @returns {Proxy} The proxy-wrapped state object.
 */
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
/**
 * Automatically suggests a theme ('light' or 'dark') based on the user's local time,
 * applying 'dark' between 6 PM and 6 AM if no manual theme is set.
 * @returns {void}
 */
function applyTimeTheme() {
    // Only auto-suggest if no manual theme is saved yet
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = hour < 6 || hour > 18 ? 'dark' : 'light';
        window.appState.ui.theme = suggestedTheme;
    }
}

// Enhanced Selective Subscription Helper
/**
 * Subscribes a callback function to listen for changes on a specific state key.
 * @param {string} key - The state key to listen for (e.g., 'theme', 'user', or '*').
 * @param {Function} callback - The function to execute when the state changes.
 */
window.subscribeToState = (key, callback) => {
    if (typeof callback === 'function') {
        // Store the callback along with the key it cares about
        window.appState.subscribers.push({ key, callback });
        console.log(`Phase 1.3: Registered selective subscriber for [${key}]`);
    }
};

/**
 * Initializes the entire state management system.
 * Loads defaults, registers core subscribers, applies current themes, and runs time detection.
 * @returns {Promise<void>}
 */
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