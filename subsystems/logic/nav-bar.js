// subsystems/logic/nav-bar.js
class NavBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
            { name: "Login", href: "/skeleton/auth_placeholder.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        const style = `
            nav { background: var(--nav-bg); padding: 10px; display: flex; justify-content: center; }
            .nav-links a { color: var(--nav-link-color); text-decoration: none; margin: 0 15px; font-family: sans-serif; font-weight: bold; }
            .nav-links a:hover, .nav-links a.active { color: #3DB5FF; }
        `;

        const nav = document.createElement('nav');
        const navLinks = document.createElement('div');
        navLinks.className = 'nav-links';

        links.forEach(link => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.name;
            
            if (window.location.pathname.endsWith(link.href) || 
               (window.location.pathname === '/' && link.href === '/index.html')) {
                a.classList.add('active');
            }
            navLinks.appendChild(a);
        });

        nav.appendChild(navLinks);

        this.shadowRoot.innerHTML = `<style>${style}</style>`;
        this.shadowRoot.appendChild(nav);
    }
}
customElements.define('nav-bar', NavBar);