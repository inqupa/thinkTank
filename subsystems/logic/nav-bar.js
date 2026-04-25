// subsystems/logic/nav-bar.js
class NavBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        // Safeguard: Visual Alarm for God Mode
        if (document.cookie.includes('vent_godmode=true')) {
            const warningBanner = document.createElement('div');
            warningBanner.style.cssText = `
                background-color: #ff0000;
                color: #ffffff;
                text-align: center;
                padding: 5px;
                font-family: sans-serif;
                font-weight: bold;
                font-size: 0.85rem;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                z-index: 10000;
                pointer-events: none;
            `;
            warningBanner.innerText =
                '⚠️ SYSTEM SAFEGUARD: GOD MODE ACTIVE. SUBMISSIONS QUARANTINED AS TEST DATA.';

            // Push the body down so the banner doesn't cover your UI
            document.body.style.marginTop = '30px';
            document.body.appendChild(warningBanner);
        }
        this.render();
    }

    render() {
        const links = [
            { name: 'Home', href: '/index.html' },
            {
                name: 'Vents | Problems',
                href: '/skeleton/problem_placeholder.html'
            },
            { name: 'Login', href: '/skeleton/auth_placeholder.html' },
            { name: 'Profile', href: '/skeleton/profile_placeholder.html' }
        ];

        const nav = document.createElement('nav');
        const navLinks = document.createElement('div');
        navLinks.className = 'nav-links';

        links.forEach((link) => {
            const a = document.createElement('a');
            a.href = link.href;
            a.textContent = link.name;

            // Highlight the active page
            const currentPath = window.location.pathname.replace('.html', '');
            const linkPath = link.href.replace('.html', '');

            if (
                currentPath.endsWith(linkPath) ||
                (currentPath === '/' && linkPath === '/index')
            ) {
                a.classList.add('active');
            }
            navLinks.appendChild(a);
        });

        nav.appendChild(navLinks);

        this.shadowRoot.innerHTML = `<link rel="stylesheet" href="/skin/components/nav-bar.css">`;
        this.shadowRoot.appendChild(nav);
    }
}
customElements.define('nav-bar', NavBar);
