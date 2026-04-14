// subsystems/logic/user-card.js
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
        const fragment = document.createDocumentFragment();
        const content = template.content.cloneNode(true);

        const nameData = window.appState?.user?.name || "username";
        const bioData = window.appState?.user?.bio || "Bio...";

        content.querySelector('.username').textContent = nameData;
        content.querySelector('.bio').textContent = bioData;

        fragment.appendChild(content);
        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(fragment);
    }
}
customElements.define('user-card', UserCard);