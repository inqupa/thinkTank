/** * bootloader.js
 * Purpose: Analyzes the current skeleton and injects config-defined assets.
 */
async function bootloader() {
    try {
        const response = await fetch('/config/manifest.json');
        const manifest = await response.json();
        // Identify current file name (e.g., "index.html")
        const pageFile = window.location.pathname.split('/').pop() || 'index.html';
        const config = manifest.mapping[pageFile] || {};
        
        // 1. Inject assets as usual...
        // Inject Core System Files
        manifest.system.core_logic.forEach(src => injectScript(src));
        // Inject Page-Specific Logic (JS Components)
        if (config.logic) config.logic.forEach(src => injectScript(src));
    } catch (e) {
        console.error("Logic hydration failed:", e);
    }
}

function injectScript(src) {
    if (!document.querySelector(`script[src*="${src}"]`)) {
        const script = document.createElement('script');
        script.src = '../' + src;
        // Logic check: Core systems like state.js should load without defer
        // to ensure they are ready before components like nav-bar.js
        if (src.includes('state.js')) {
            script.async = false; // Ensures synchronous execution in order
        } else {
            script.defer = true;
        }
        document.body.appendChild(script);
    }
}

bootloader();