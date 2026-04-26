import{n as e,t}from"./chunk-DTVk4-W3.js";import{i as n,n as r,r as i,t as a}from"./nav-bar-D8UPILc0.js";var o,s=e((()=>{o=`.header{border-bottom:1px solid #80808033;flex-direction:column;align-items:center;padding-bottom:20px;display:flex}.profile-picture{background-color:var(--accent-color);color:#fff;border-radius:50%;justify-content:center;align-items:center;width:100px;height:100px;margin-bottom:15px;font-family:sans-serif;font-size:3rem;font-weight:700;display:flex}.username{color:var(--text-primary);text-transform:capitalize;margin:5px 0;font-family:sans-serif;font-size:1.8rem}.role{color:var(--accent-color);text-transform:uppercase;letter-spacing:1px;margin-bottom:15px;font-family:sans-serif;font-size:.9rem;font-weight:700}.details-grid{color:var(--text-primary);grid-template-columns:1fr;gap:15px;margin-top:20px;font-family:sans-serif;display:grid}.detail-item{background:var(--bg-color);border-radius:8px;justify-content:space-between;padding:12px 15px;display:flex}.detail-label{opacity:.8;font-weight:700}.logout-btn{border:2px solid var(--accent-color);width:100%;color:var(--text-primary);cursor:pointer;background:0 0;border-radius:8px;margin-top:30px;padding:12px;font-weight:700;transition:all .2s}.logout-btn:hover{background:var(--accent-color);color:#fff}`})),c=t((()=>{s();var e=class extends HTMLElement{constructor(){super(),this.attachShadow({mode:`open`})}async connectedCallback(){this.renderLoading(),await this.loadUserData()}async loadUserData(){try{let e=await fetch(`/api/user/me`);if(!e.ok){if(e.status===401){window.location.href=`/skeleton/auth_placeholder.html`;return}throw Error(`Failed to load profile`)}let t=await e.json();this.render(t)}catch(e){console.error(e),this.renderError()}}renderLoading(){this.shadowRoot.innerHTML=`<p style="text-align: center; color: var(--text-primary); font-family: sans-serif;">Loading profile data...</p>`}renderError(){this.shadowRoot.innerHTML=`<p style="text-align: center; color: red; font-family: sans-serif;">Error loading profile.</p>`}render(e){if(!e)return;let t=new Date(e.joined).toLocaleDateString(`en-US`,{month:`long`,year:`numeric`}),n=e.email.charAt(0).toUpperCase();this.shadowRoot.innerHTML=`
        <style>${o}</style>
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
        `,this.shadowRoot.getElementById(`logout`).addEventListener(`click`,()=>{document.cookie=`vent_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`,window.location.href=`/index.html`})}};customElements.define(`user-card`,e)}));n(),i(),r(),a(),c();