// 1. Core App Initialization (Service Worker & DB)
const startApp = async () => {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/public/sw.js');
            console.log('Phase 3.3: Service Worker Active');
        } catch (err) {
            console.error('SW Registration Failed:', err);
        }
    }

    if (window.initDB) {
        try {
            await window.initDB();
            console.log('Phase 3.1: Database Connected');
        } catch (dbErr) {
            console.error('Database initialization failed:', dbErr);
            const errorBanner = document.createElement('div');
            errorBanner.style =
                'position:fixed; top:0; width:100%; background:red; color:white; text-align:center; padding:10px; z-index:9999; font-family:sans-serif;';
            errorBanner.textContent =
                'Critical Error: Offline storage is unavailable.';
            document.body.prepend(errorBanner);
        }
    }
};

window.addEventListener('load', startApp);

// 2. Textarea Auto-Resize & Focus Logic
const tx = document.getElementById('vent-input');

function OnInput() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
}

if (tx) {
    tx.addEventListener('input', OnInput, false);

    window.addEventListener('load', () => {
        OnInput.call(tx);
        tx.focus();
    });
}

window.addEventListener('load', () => {
    const input =
        document.querySelector('#vent-input') ||
        document.querySelector('#email');
    if (input) input.focus();
});

// 3. Submit Vent Logic
const submitBtn = document.querySelector('#submit-vent');

if (submitBtn) {
    submitBtn.addEventListener('click', async function (e) {
        e.preventDefault();

        const input = document.getElementById('vent-input');
        const content = input.value.trim();

        if (content && window.saveVent) {
            const ventData = {
                content: content,
                vent_month_year: new Date().toLocaleString('en-US', {
                    month: 'long',
                    year: 'numeric'
                })
            };

            try {
                await window.saveVent(ventData);

                setTimeout(() => {
                    window.location.href = '/skeleton/problem_placeholder.html';
                }, 500);
            } catch (err) {
                alert('Connection failed. Your vent could not be saved.');
            }
        }
    });

    // 4. Preload Resources on Hover
    let hoverChecked = false;
    const triggerHover = () => {
        if (hoverChecked) return;
        hoverChecked = true;

        const preloads = [
            '/skeleton/problem_placeholder.html',
            '/skin/problem_style_placeholder.css'
        ];
        preloads.forEach((href) => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = href;
            document.head.appendChild(link);
        });

        fetch('/api/problems/access?peek=true')
            .then((res) => res.json())
            .then((data) => {
                if (data.requireAuth) {
                    const authLink = document.createElement('link');
                    authLink.rel = 'prefetch';
                    authLink.href = '/skeleton/auth_placeholder.html';
                    document.head.appendChild(authLink);
                }
            })
            .catch((err) => {});
    };

    submitBtn.addEventListener('mouseenter', triggerHover, { once: true });
    submitBtn.addEventListener('touchstart', triggerHover, { once: true });
}
