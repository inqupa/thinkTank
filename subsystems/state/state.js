// Phase 2.2 Refined: Global State with Persistence
const initialState = {
    name: "User Name",
    bio: "Short bio goes here.",
    theme: localStorage.getItem('theme') || "light", // Pull saved theme or default to light
    visitCount: 0
};

function updateUI(property, value) {
    if (property === "theme") {
        if (document.body) {
            document.body.setAttribute('data-theme', value);
            localStorage.setItem('theme', value); // Save to browser memory
            console.log(`%c Signal: Theme applied -> ${value}`, "color: #28a745;");
        }
        return;
    }

    const element = document.getElementById(`sig-${property}`);
    if (element) {
        element.textContent = value;
    }
}

function createPersistentState(state) {
    return new Proxy(state, {
        set(target, property, value) {
            target[property] = value;
            updateUI(property, value);
            return true;
        }
    });
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