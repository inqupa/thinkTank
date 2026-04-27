// subsystems/logic/user-card.ts
import userStyles from '../../skin/components/user-card.css?inline';

interface UserData {
    name: string;
    email: string;
    joined: string;
    [key: string]: any;
}

class UserCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback(): Promise<void> {
        this.renderLoading();
        await this.loadUserData();
    }

    async loadUserData(): Promise<void> {
        try {
            const response = await fetch('/api/user/me');
            if (!response.ok) {
                if (response.status === 401) {
                    // Redirect to login if not authenticated
                    window.location.href = '/skeleton/auth_placeholder.html';
                    return;
                }
                throw new Error('Failed to load profile');
            }
            const data: UserData = await response.json();
            this.render(data);
        } catch (err) {
            console.error(err);
            this.renderError();
        }
    }

    renderLoading(): void {
        (this.shadowRoot as ShadowRoot).innerHTML = 
            `<p style="text-align: center; color: var(--text-primary); font-family: sans-serif;">Loading profile data...</p>`;
    }

    renderError(): void {
        (this.shadowRoot as ShadowRoot).innerHTML = 
            `<p style="text-align: center; color: red; font-family: sans-serif;">Error loading profile.</p>`;
    }

    render(userData: UserData | null): void {
        if (!userData) return;

        const joinedDate = new Date(userData.joined).toLocaleDateString(
            'en-US',
            { month: 'long', year: 'numeric' }
        );
        const initial = userData.email.charAt(0).toUpperCase();

        (this.shadowRoot as ShadowRoot).innerHTML = `
        <style>${userStyles}</style>
        <div class="header">
                <div class="profile-picture">${initial}</div>
                <h1 class="username">${userData.name}</h1>
                <div class="role">Vent Member</div>
            </div>
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span>${userData.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joined</span>
                    <span>${joinedDate}</span>
                </div>
            </div>
            <button class="logout-btn" id="logout">Log Out</button>
        `;

        // Handle Logout by destroying the cookie
        const logoutBtn = (this.shadowRoot as ShadowRoot).getElementById('logout') as HTMLButtonElement | null;
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                document.cookie =
                    'vent_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                window.location.href = '/index.html';
            });
        }
    }
}
customElements.define('user-card', UserCard);