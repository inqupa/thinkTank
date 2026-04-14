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

        // 1. Inject Core System Files
        manifest.system.core_styles.forEach(href => injectLink(href, 'stylesheet'));
        manifest.system.core_logic.forEach(src => injectScript(src));

        // 2. Inject Page-Specific Skin (CSS)
        if (config.skin) config.skin.forEach(href => injectLink(href, 'stylesheet'));

        // 3. Inject Page-Specific Logic (JS Components)
        if (config.logic) config.logic.forEach(src => injectScript(src));

    } catch (error) {
        console.error("Orchestrator failed to boot:", error);
    }
}

function injectLink(href, rel) {
    if (!document.querySelector(`link[href*="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = rel;
        link.href = '/' + href;
        document.head.appendChild(link);
    }
}

function injectScript(src) {
    if (!document.querySelector(`script[src*="${src}"]`)) {
        const script = document.createElement('script');
        script.src = '/' + src;
        script.defer = true;
        document.body.appendChild(script);
    }
}

bootloader();