/** * bootloader.js
 * Purpose: Analyzes the current skeleton and injects config-defined assets.
 */
async function bootloader() {
    try {
        const response = await fetch('/config/manifest.json');
        const manifest = await response.json();
        const pageFile =
            window.location.pathname.split('/').pop() || 'index.html';
        const config = manifest.mapping[pageFile] || {};

        console.log(`Bootloader: Loading assets for ${pageFile}`);

        manifest.system.core_logic.forEach((src) => injectScript(src));

        if (config.logic) {
            config.logic.forEach((src) => injectScript(src));
        } else {
            console.log(
                `Bootloader: No specific logic found in manifest for ${pageFile}`
            );
        }
    } catch (e) {
        console.error('Logic hydration failed:', e);
    }
}

function injectScript(src) {
    if (!document.querySelector(`script[src*="${src}"]`)) {
        const script = document.createElement('script');
        script.src = '/' + src;
        // Forces the browser to execute dynamically added scripts in the exact order they are injected
        script.async = false;
        document.body.appendChild(script);
        console.log(`Bootloader: Injected /${src}`);
    }
}

bootloader();
