// Phase 3.2: Shadow DOM Implementation
class NavBar extends HTMLElement {
    constructor() {
        super();
        // Attach a shadow root to the element 
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const currentPath = window.location.pathname;
        const links = [
            { name: "Home", href: "/index.html" },
            { name: "Vents | Problems", href: "/skeleton/problem_placeholder.html" },
            { name: "Login | Sign-up", href: "/skeleton/auth_placeholder.html" },
            { name: "Profile", href: "/skeleton/profile_placeholder.html" }
        ];

        // The innerHTML is now set on the shadowRoot, not the element itself
        this.shadowRoot.innerHTML = `
            <style>
                /* These styles are now encapsulated and won't leak out  */
                nav {
                    background: #333;
                    padding: 10px;
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
                }
                .nav-links a:hover, .nav-links a.active {
                    color: white;
                    text-decoration: underline;
                }
                .nav-links a.active {
                    border-bottom: 2px solid white;
                    padding-bottom: 2px;
                }
            </style>
            <nav>
                <div class="nav-links">
                    ${links.map(link => {
                        const isActive = currentPath.endsWith(link.href) ? 'class="active"' : '';
                        return `<a href="${link.href}" ${isActive}>${link.name}</a>`;
                    }).join('')}
                </div>
            </nav>
        `;
        console.log("%c Shadow DOM: <nav-bar> encapsulated", "color: #20c997; font-weight: bold;");
    }
}

if (!customElements.get('nav-bar')) {
    customElements.define('nav-bar', NavBar);
}