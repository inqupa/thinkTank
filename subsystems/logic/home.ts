// subsystems/logic/home.ts

// 1. Import the virtual module at the top of your file
import { registerSW } from 'virtual:pwa-register';

// Define the shape of the data passed to the global save function
interface VentSubmitData {
    content: string;
    vent_month_year: string;
}

// Tell TypeScript these functions exist on the global window object
declare global {
    interface Window {
        initDB?: () => Promise<any>;
        saveVent?: (data: VentSubmitData) => Promise<any>;
    }
}

const startApp = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
        try {
            // Let the plugin handle the environment-specific paths and registration
            registerSW({
                onRegistered(_r: any) {
                    console.log('Phase 3.3: Service Worker Active');
                },
                onRegisterError(err: any) {
                    console.error('SW Registration Failed:', err);
                }
            });
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
            // TS Fix: Use cssText instead of direct string assignment to the style object
            errorBanner.style.cssText =
                'position:fixed; top:0; width:100%; background:red; color:white; text-align:center; padding:10px; z-index:9999; font-family:sans-serif;';
            errorBanner.textContent =
                'Critical Error: Offline storage is unavailable.';
            document.body.prepend(errorBanner);
        }
    }
};

window.addEventListener('load', startApp);

// 2. Textarea Auto-Resize & Focus Logic
const tx = document.getElementById('vent-input') as HTMLTextAreaElement | null;

// TS Fix: Explicitly define what 'this' refers to within the function
function OnInput(this: HTMLTextAreaElement): void {
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
        document.querySelector<HTMLTextAreaElement>('#vent-input') ||
        document.querySelector<HTMLInputElement>('#email');
    if (input) input.focus();
});

// 3. Submit Vent Logic
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-vent');

if (submitBtn) {
    submitBtn.addEventListener('click', async function (e: Event) {
        e.preventDefault();

        const input = document.getElementById('vent-input') as HTMLTextAreaElement | null;
        if (!input) return;

        const content = input.value.trim();

        if (content && window.saveVent) {
            const ventData: VentSubmitData = {
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
    const triggerHover = (): void => {
        if (hoverChecked) return;
        hoverChecked = true;

        const preloads: string[] = [
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
            .then((data: { requireAuth?: boolean }) => {
                if (data.requireAuth) {
                    const authLink = document.createElement('link');
                    authLink.rel = 'prefetch';
                    authLink.href = '/skeleton/auth_placeholder.html';
                    document.head.appendChild(authLink);
                }
            })
            .catch((_err) => {});
    };

    submitBtn.addEventListener('mouseenter', triggerHover, { once: true });
    submitBtn.addEventListener('touchstart', triggerHover, { once: true });
}