// --- 1. NATIVE ROUTER CORE ---
class SimpleRouter {
    constructor() {
        this.routes = [];
        const allowedOrigins =[
            'http://localhost:8787',
            'https://vent.inqupa.workers.dev'
        ];
        const origin = request.headers.get('Origin');
        // If origin matches, allow it. Otherwise, fallback to the first allowed origin (blocks unauthorized sites)
        const isAllowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
        this.corsHeaders = {
            "Access-Control-Allow-Origin": isAllowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token, Cookie",
            // Defense in Depth: Content Security Policy
            // Only allows scripts from your own origin. Blocks inline scripts and evals.
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        };
    }

    add(method, path, handler) {
        // Convert paths like '/api/vent/:id' into regex '^\/api\/vent\/([^\/]+)$'
        const paramNames = [];
        const regexPath = path.replace(/:([^\/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        this.routes.push({ method, regex: new RegExp(`^${regexPath}$`), handler, paramNames });
    }

    get(path, handler) { this.add('GET', path, handler); }
    post(path, handler) { this.add('POST', path, handler); }
    delete(path, handler) { this.add('DELETE', path, handler); }

    async handle(request, env) {
        const url = new URL(request.url);

        // A. Automatically handle CORS Preflight (OPTIONS)
        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: this.corsHeaders });
        }

        // B. Match the route
        for (const route of this.routes) {
            if (route.method === request.method) {
                const match = url.pathname.match(route.regex);
                if (match) {
                    // Extract URL variables and attach to request.params
                    request.params = {};
                    route.paramNames.forEach((name, i) => {
                        request.params[name] = match[i + 1];
                    });

                    try {
                        const response = await route.handler(request, env, url);
                        
                        // C. Automatically inject CORS headers into the successful response
                        const newResponse = new Response(response.body, response);
                        Object.entries(this.corsHeaders).forEach(([k, v]) => newResponse.headers.set(k, v));
                        return newResponse;

                    } catch (error) {
                        console.error("Route Error:", error);
                        return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
                            status: 500, 
                            headers: { ...this.corsHeaders, "Content-Type": "application/json" } 
                        });
                    }
                }
            }
        }

        // D. 404 Catch-All
        return new Response("Not Found", { status: 404, headers: this.corsHeaders });
    }
}

const router = new SimpleRouter();

// --- 2. API ENDPOINTS ---

router.get('/api/dev/godmode', (request, env, url) => {
    const enable = url.searchParams.get('enable') === 'true';
    let headers = new Headers();
    headers.set("Set-Cookie", enable ? "vent_godmode=true; Path=/; Max-Age=31536000; SameSite=Lax" : "vent_godmode=; Path=/; Max-Age=0; SameSite=Lax");
    return new Response(enable ? "God mode enabled." : "God mode disabled.", { status: 200, headers });
});

router.post('/api/vent', async (request, env) => {
    const payload = await request.json();
    if (!payload.content || typeof payload.content !== 'string' || payload.content.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Vent content cannot be empty." }), { status: 400 });
    }
    
    const ventTrackingId = crypto.randomUUID(); 
    let solverId = null;
    let isTest = 0;
    const cookieHeader = request.headers.get('Cookie');

    if (cookieHeader) {
        if (cookieHeader.includes('vent_session=')) solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
        if (cookieHeader.includes('vent_godmode=true')) isTest = 1; 
    }
    
    await env.vent_black.prepare(
        "INSERT INTO vents (id, content, vent_month_year, solver_id, is_test) VALUES (?, ?, ?, ?, ?)"
    ).bind(ventTrackingId, payload.content, payload.vent_month_year, solverId, isTest).run();

    return new Response(JSON.stringify({ success: true, trackingId: ventTrackingId, message: "Vent submitted securely." }), { status: 200 });
});

router.get('/api/vents', async (request, env) => {
    const { results } = await env.vent_black.prepare("SELECT id, content, vent_month_year, created_at, is_test FROM vents ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), { status: 200 });
});

router.get('/api/csrf-token', () => {
    const token = crypto.randomUUID();
    let headers = new Headers({ "Content-Type": "application/json" });
    headers.set("Set-Cookie", `csrf_token=${token}; Path=/; SameSite=Strict; Max-Age=86400`);
    return new Response(JSON.stringify({ csrfToken: token }), { status: 200, headers });
});

// Notice how we use :id here, and the native router parses it!
router.delete('/api/vent/:id', async (request, env) => {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader || !cookieHeader.includes('vent_session=')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const csrfCookieMatch = cookieHeader.match(/csrf_token=([^;]+)/);
    if (!csrfHeader || !csrfCookieMatch || csrfHeader !== csrfCookieMatch[1]) {
        return new Response(JSON.stringify({ error: "Forbidden: CSRF token missing" }), { status: 403 });
    }

    const solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
    const ventId = request.params.id; // Native variable extraction!

    const targetVent = await env.vent_black.prepare("SELECT solver_id FROM vents WHERE id = ?").bind(ventId).first();
    if (!targetVent || targetVent.solver_id !== solverId) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });
    }

    await env.vent_black.prepare("DELETE FROM vents WHERE id = ?").bind(ventId).run();
    return new Response(JSON.stringify({ success: true, message: "Vent deleted." }), { status: 200 });
});

// --- 3. EXPORT HANDLER ---
export default {
    fetch: (request, env) => router.handle(request, env)
};