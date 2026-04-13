class NavBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        window.subscribeToState('ui', () => this.render());
        this.render();
    }

    render() {
        const template = document.getElementById('nav-bar-template');
        if (!template) return;

        this.shadowRoot.innerHTML = '';
        const content = template.content.cloneNode(true);
        const navLinks = content.querySelector('.nav-links');

        // Logic for links
        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.name;
            navLinks.appendChild(a);
        });

        this.shadowRoot.appendChild(content);
    }
}
customElements.define('nav-bar', NavBar);

class UserCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    // Inside class UserCard in subsystems/router.js
    connectedCallback() {
        // Explicitly listen to the 'user' namespace
        window.subscribeToState('user', () => {
            console.log("Phase 2.3: User namespace changed, re-rendering...");
            this.render();
        });
        this.render();
    }

    render() {
        const template = document.getElementById('user-card-template');
        if (!template) return;

        // Clear Shadow DOM
        this.shadowRoot.innerHTML = '';

        // Clone Template
        const content = template.content.cloneNode(true);

        // Map State to Cloned DOM
        // Use the new namespaced path: appState.user.name
        const nameData = window.appState?.user?.name || "User Name";
        const bioData = window.appState?.user?.bio || "Bio...";

        content.querySelector('.username').textContent = nameData;
        content.querySelector('.bio').textContent = bioData;

        // Final Append
        this.shadowRoot.appendChild(content);
    }
}
customElements.define('user-card', UserCard);