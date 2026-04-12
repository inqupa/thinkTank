// Phase 3.3 Refined: Persistent Attribute Reflection
class NavBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['mode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        // Save the choice to localStorage whenever the attribute is set
        if (name === 'mode') {
            localStorage.setItem('nav-mode', newValue);
        }
        this.render();
    }

    connectedCallback() {
        // FIXED: When the component loads on a new page, pull the saved mode
        const savedMode = localStorage.getItem('nav-mode') || 'full';
        this.setAttribute('mode', savedMode);
        this.render();
    }

    render() {
        const currentPath = window.location.pathname;
        const mode = this.getAttribute('mode') || 'full';
        
        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
            { name: "Login", href: "/skeleton/auth_placeholder.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        const filteredLinks = mode === 'minimal' 
            ? links.filter(l => l.name === "Home" || l.name === "Profile") 
            : links;

        this.shadowRoot.innerHTML = `
            <style>
                nav {
                    background: #333;
                    padding: ${mode === 'minimal' ? '5px' : '10px'};
                    display: flex;
                    justify-content: center;
                }
                .nav-links a {
                    color: rgba(255, 255, 255, 0.6);
                    text-decoration: none;
                    margin: 0 15px;
                    font-family: sans-serif;
                    font-weight: bold;
                    transition: color 0.3s ease;
                    font-size: ${mode === 'minimal' ? '0.8rem' : '1rem'};
                }
                .nav-links a:hover, .nav-links a.active { color: white; }
                .nav-links a.active { border-bottom: 2px solid white; }
            </style>
            <nav>
                <div class="nav-links">
                    ${filteredLinks.map(link => {
                        const isActive = currentPath.endsWith(link.href) ? 'class="active"' : '';
                        return `<a href="${link.href}" ${isActive}>${link.name}</a>`;
                    }).join('')}
                </div>
            </nav>
        `;
    }
}

if (!customElements.get('nav-bar')) {
    customElements.define('nav-bar', NavBar);
}

// Phase 3.4: Componentize the Profile Card
class UserCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        
        // Listen for global state changes to update automatically
        window.addEventListener('stateChange', () => this.render());
    }

    render() {
        // Fallback data if appState isn't ready
        const name = window.appState?.name || "User Name";
        const bio = window.appState?.bio || "Short bio goes here.";

        this.shadowRoot.innerHTML = `
            <style>
                .header {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .profile-picture {
                    width: 150px;
                    height: 150px;
                    background-color: #ddd;
                    border-radius: 50%;
                    margin-bottom: 20px;
                }
                .username { 
                    margin: 10px 0; 
                    color: var(--text-color, #333);
                }
                .bio { 
                    color: #666; 
                    text-align: center; 
                    margin-bottom: 10px;
                }
            </style>
            <div class="header">
                <div class="profile-picture"></div>
                <h1 class="username">${name}</h1>
                <p class="bio">${bio}</p>
            </div>
        `;
    }
}

if (!customElements.get('user-card')) {
    customElements.define('user-card', UserCard);
}