// subsystems/state/state.ts
import defaultStateData from '../../public/data/default_state.json';

// --- TYPE DEFINITIONS ---
export interface UserState {
    name: string;
    bio: string;
    email: string;
    [key: string]: any; 
}

export interface UIState {
    theme: string;
    dismissedSuggestion: boolean;
    [key: string]: any;
}

export interface DataState {
    visitCount: number;
    [key: string]: any;
}

export interface AppState {
    user: UserState;
    ui: UIState;
    data: DataState;
    subscribers: Array<{key: string, callback: Function}>;
}

// Tell TypeScript we are intentionally modifying the global Window object
declare global {
    interface Window {
        appState: AppState;
        subscribeToState: (key: string, callback: Function) => void;
    }
}

// --- STATE INITIALIZATION ---
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

// 1. Try to load existing state from the hard drive first
const savedState = localStorage.getItem('vent_app_state');
const parsedState = savedState ? JSON.parse(savedState) : {};

// 2. Define initialState, merging saved data if it exists
let initialState: AppState = {
    user: { name: '', bio: '', email: '', ...(parsedState.user || {}) },
    ui: {
        theme: 'light',
        dismissedSuggestion: false,
        ...(parsedState.ui || {})
    },
    data: { visitCount: 0, ...(parsedState.data || {}) },
    subscribers: []
};

// 3. Create the Proxy immediately
window.appState = createPersistentState(initialState) as AppState;


// --- FUNCTIONS ---

async function loadInitialState(): Promise<void> {
    const saved = localStorage.getItem('app_state_exists');
    if (!saved) {
        try {
            const defaults: any = defaultStateData;
            Object.assign(initialState.user, defaults.user);
            Object.assign(initialState.ui, defaults.ui);
            Object.assign(initialState.data, defaults.data);
            localStorage.setItem('app_state_exists', 'true');
        } catch (e) {
            console.error('Failed to load state snapshot:', e);
        }
    }
}

function updateUI(prop: string, val: any): void {
    if (prop === 'theme') {
        if (val === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    const elements = document.querySelectorAll(`[id^="sig-${prop}"]`);
    elements.forEach((el) => {
        el.textContent = String(val);
    });
}

function debouncedSaveState(): void {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
    }

    saveTimeout = setTimeout(() => {
        if (!window.appState) return;

        const stateToSave = {
            user: window.appState.user,
            ui: window.appState.ui,
            data: window.appState.data
        };

        try {
            localStorage.setItem('vent_app_state', JSON.stringify(stateToSave));
            console.log('Phase 1 Security: State securely saved to localStorage (debounced)');
        } catch (e) {
            console.error('Failed to save state. Storage quota may be exceeded.', e);
        }
    }, 2000);
}

function createPersistentState<T extends object>(state: T): T {
    const MAX_DEPTH = 3;

    function buildProxy(targetObj: any, currentDepth: number): any {
        if (currentDepth > MAX_DEPTH) {
            console.warn(`Phase 2: State depth exceeded ${MAX_DEPTH} levels. Returning raw object.`);
            return targetObj;
        }

        const handler: ProxyHandler<any> = {
            get(target, property) {
                const value = target[property as keyof typeof target];
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
                if (target[property as keyof typeof target] === value) {
                    return true;
                }

                target[property as keyof typeof target] = value;

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
                                sub.callback(property as string, value);
                            } catch (err) {
                                console.error('Subscriber execution failed:', err);
                            }
                        }
                    });
                }

                debouncedSaveState();
                window.dispatchEvent(new Event('stateChange'));
                return true;
            }
        };
        return new Proxy(targetObj, handler);
    }

    return buildProxy(state, 1);
}

function applyTimeTheme(): void {
    if (!localStorage.getItem('theme')) {
        const hour = new Date().getHours();
        const suggestedTheme = hour < 6 || hour > 18 ? 'dark' : 'light';
        window.appState.ui.theme = suggestedTheme;
    }
}

window.subscribeToState = (key: string, callback: Function) => {
    if (typeof callback === 'function') {
        window.appState.subscribers.push({ key, callback });
        console.log(`Phase 1.3: Registered selective subscriber for [${key}]`);
    }
};

async function startStateSystem(): Promise<void> {
    await loadInitialState();

    window.subscribeToState('theme', (prop: string, val: any) => {
        updateUI(prop, val);
    });

    const currentTheme = window.appState.ui.theme || localStorage.getItem('theme');
    if (currentTheme) {
        updateUI('theme', currentTheme);
    }

    applyTimeTheme();
    console.log('Phase 1.1: State System Populated');
}

startStateSystem();