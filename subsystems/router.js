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

        // Phase 2.3: Create a Virtual Fragment (in-memory container)
        const fragment = document.createDocumentFragment();
        
        // Clone the template into the fragment
        const content = template.content.cloneNode(true);
        const navLinks = content.querySelector('.nav-links');

        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
            { name: "Login", href: "/skeleton/auth_placeholder.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.name;
            if (window.location.pathname.endsWith(link.href)) a.classList.add('active');
            navLinks.appendChild(a);
        });

        // Add everything to the fragment first
        fragment.appendChild(content);

        // Final step: Clear the live DOM once and swap in the fragment
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(fragment);
    }
}

class UserCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        window.subscribeToState('user', () => this.render());
        this.render();
    }

    render() {
        const template = document.getElementById('user-card-template');
        if (!template) return;

        // Phase 2.3: Create a Virtual Fragment
        const fragment = document.createDocumentFragment();
        const content = template.content.cloneNode(true);

        const nameData = window.appState?.user?.name || "User Name";
        const bioData = window.appState?.user?.bio || "Bio...";

        content.querySelector('.username').textContent = nameData;
        content.querySelector('.bio').textContent = bioData;

        fragment.appendChild(content);

        // Clear live DOM and swap
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(fragment);
    }
}

if (!customElements.get('nav-bar')) customElements.define('nav-bar', NavBar);
if (!customElements.get('user-card')) customElements.define('user-card', UserCard);