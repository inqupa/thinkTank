import{a as e,i as t,n,r,t as i}from"./nav-bar-D8nnvfLe.js";var a=e((()=>{var e=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:`open`})}async connectedCallback(){this.renderLoading(),await this.loadUserData()}async loadUserData(){try{let e=await fetch(`/api/user/me`);if(!e.ok){if(e.status===401){window.location.href=`/skeleton/auth_placeholder.html`;return}throw Error(`Failed to load profile`)}let t=await e.json();this.render(t)}catch(e){console.error(e),this.renderError()}}renderLoading(){this.shadowRoot.innerHTML=`<p style="text-align: center; color: var(--text-primary); font-family: sans-serif;">Loading profile data...</p>`}renderError(){this.shadowRoot.innerHTML=`<p style="text-align: center; color: red; font-family: sans-serif;">Error loading profile.</p>`}render(e){if(!e)return;let t=new Date(e.joined).toLocaleDateString(`en-US`,{month:`long`,year:`numeric`}),n=e.email.charAt(0).toUpperCase();this.shadowRoot.innerHTML=`
            <link rel="stylesheet" href="/skin/components/user-card.css">
            <div class="header">
                <div class="profile-picture">${n}</div>
                <h1 class="username">${e.name}</h1>
                <div class="role">Think Tank Member</div>
            </div>
            <div class="details-grid">
                <div class="detail-item">
                    <span class="detail-label">Email</span>
                    <span>${e.email}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Joined</span>
                    <span>${t}</span>
                </div>
            </div>
            <button class="logout-btn" id="logout">Log Out</button>
        `,this.shadowRoot.getElementById(`logout`).addEventListener(`click`,()=>{document.cookie=`vent_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,window.location.href=`/index.html`})}};customElements.define(`user-card`,e)}));t(),r(),n(),i(),a();