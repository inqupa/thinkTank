// Phase 1.1: Global State Object
const initialState = {
    user: {
        name: "User Name",
        email: "user@example.com",
        location: "City, Country",
        bio: "Short bio or user description goes here.",
        joined: "January 2026",
        isLoggedIn: false,
        visitCount: 0
    },
    ui: {
        theme: "light",
        currentView: "landing"
    }
};

// Phase 1.3: UI Signal Function
// This function looks for an HTML element and updates its text if it exists.
function updateUI(property, value) {
    const element = document.getElementById(`sig-${property}`);
    if (element) {
        element.textContent = value;
        console.log(`%c Signal: Updated DOM element #sig-${property}`, "color: #28a745;");
    }
}

// Phase 1.2: Basic Listener (Enhanced for Phase 1.3)
function createPersistentState(state) {
    return new Proxy(state, {
        set(target, property, value) {
            target[property] = value;
            // Phase 1.3 Trigger: Update the UI whenever a property changes
            updateUI(property, value);
            
            console.log(`%c State Change: ${property} ->`, "color: #007bff; font-weight: bold;", value);
            return true;
        }
    });
}

// Phase 1.4: User Data Template
// This function returns a dynamic HTML string based on the current user state.
function renderProfileHeader() {
    const { name, bio } = window.appState.user;
    return `
        <div class="profile-picture"></div>
        <h1 class="username" id="sig-name">${name}</h1>
        <p class="bio" id="sig-bio">${bio}</p>
    `;
}

console.log("Template function renderProfileHeader() is ready.");

window.appState = createPersistentState(initialState);