// --- IMPORT CONTROLLERS ---
import { registerAuthRoutes } from './auth.js';
import { registerVentRoutes } from './vents.js';
import { registerSystemRoutes } from './system.js';

// --- 1. NATIVE ROUTER CORE ---
class SimpleRouter {
    constructor() {
        this.routes = [];
    }

    add(method, path, handler) {
        const paramNames = [];
        const regexPath = path.replace(/:([^\/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        this.routes.push({
            method,
            regex: new RegExp(`^${regexPath}$`),
            handler,
            paramNames
        });
    }

    get(path, handler) {
        this.add('GET', path, handler);
    }
    post(path, handler) {
        this.add('POST', path, handler);
    }
    delete(path, handler) {
        this.add('DELETE', path, handler);
    }

    async handle(request, env) {
        const url = new URL(request.url);

        // Define CORS dynamically based on the incoming request
        const allowedOrigins = [
            'http://localhost:8787',
            'https://vent.inqupa.workers.dev'
        ];
        const origin = request.headers.get('Origin');
        const isAllowedOrigin = allowedOrigins.includes(origin)
            ? origin
            : allowedOrigins[0];

        const corsHeaders = {
            'Access-Control-Allow-Origin': isAllowedOrigin,
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers':
                'Content-Type, X-CSRF-Token, Cookie',
            'Content-Security-Policy':
                "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        for (const route of this.routes) {
            if (route.method === request.method) {
                const match = url.pathname.match(route.regex);
                if (match) {
                    request.params = {};
                    route.paramNames.forEach((name, i) => {
                        request.params[name] = match[i + 1];
                    });

                    try {
                        const response = await route.handler(request, env, url);
                        const newResponse = new Response(
                            response.body,
                            response
                        );
                        Object.entries(corsHeaders).forEach(([k, v]) =>
                            newResponse.headers.set(k, v)
                        );
                        return newResponse;
                    } catch (error) {
                        console.error('Route Error:', error);
                        return new Response(
                            JSON.stringify({ error: 'Internal Server Error' }),
                            {
                                status: 500,
                                headers: {
                                    ...corsHeaders,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );
                    }
                }
            }
        }
        return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
}

// --- INITIALIZE AND REGISTER ROUTES ---
const router = new SimpleRouter();

registerAuthRoutes(router);
registerVentRoutes(router);
registerSystemRoutes(router);

// --- 2. API ENDPOINTS ---

// Fetch Current User's Vents
router.get('/api/user/vents', async (request, env) => {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader || !cookieHeader.includes('vent_session='))
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401
        });

    const solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
    const { results } = await env.vent_black
        .prepare(
            'SELECT id, content, vent_month_year, created_at FROM vents WHERE solver_id = ? ORDER BY created_at DESC'
        )
        .bind(solverId)
        .all();
    return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
});

// --- 3. EXPORT HANDLER ---
export default {
    fetch: (request, env) => router.handle(request, env)
};
