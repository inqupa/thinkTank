// subsystems/routers/system.ts

interface Env {
    GOD_MODE_KEY?: string;
    vent_black: any; // Cloudflare D1 Database binding
}

export function registerSystemRoutes(router: any): void {
    // 1. Developer God Mode Toggle (SECURED VIA ENV)
    router.get('/api/dev/godmode', (_request: Request, env: Env, url: URL): Response => {
        const enable = url.searchParams.get('enable') === 'true';
        const providedKey = url.searchParams.get('key'); 

        const SECRET_PASSCODE = env.GOD_MODE_KEY; 

        if (!SECRET_PASSCODE || providedKey !== SECRET_PASSCODE) {
            return new Response('Not Found', { status: 404 });
        }
        
        let headers = new Headers();
        headers.set(
            'Set-Cookie',
            enable
                ? 'vent_godmode=true; Path=/; Max-Age=31536000; SameSite=None; Secure'
                : 'vent_godmode=; Path=/; Max-Age=0; SameSite=None; Secure'
        );
        return new Response(
            enable ? 'God mode enabled.' : 'God mode disabled.',
            { status: 200, headers }
        );
    });

    // 2. Enforce Problem Page Limit
    router.get('/api/problems/access', async (request: Request, env: Env, url: URL): Promise<Response> => {
        const cookieHeader: string = request.headers.get('Cookie') || '';
        const isPeek = url.searchParams.get('peek') === 'true';

        if (cookieHeader.includes('vent_godmode=true')) {
            return new Response(
                JSON.stringify({ access: 'granted', viewsLeft: 'Infinite' }),
                { status: 200 }
            );
        }

        if (cookieHeader.includes('vent_session=')) {
            return new Response(JSON.stringify({ access: 'granted' }), {
                status: 200
            });
        }

        let anonToken: string | null = null;
        if (cookieHeader.includes('anon_shadow=')) {
            anonToken = cookieHeader.split('anon_shadow=')[1].split(';')[0];
        }

        let headers = new Headers({ 'Content-Type': 'application/json' });

        if (!anonToken) {
            if (isPeek)
                return new Response(
                    JSON.stringify({ access: 'granted', viewsLeft: 10 }),
                    { status: 200, headers }
                );
            anonToken = crypto.randomUUID();
            await env.vent_black
                .prepare(
                    'INSERT INTO anonymous_visitors (id, problem_views) VALUES (?, 1)'
                )
                .bind(anonToken)
                .run();
            headers.set(
                'Set-Cookie',
                `anon_shadow=${anonToken}; HttpOnly; Path=/; Max-Age=31536000; SameSite=None; Secure`
            );
            return new Response(
                JSON.stringify({ access: 'granted', viewsLeft: 9 }),
                { status: 200, headers }
            );
        } else {
            const visitor: any = await env.vent_black
                .prepare(
                    'SELECT problem_views FROM anonymous_visitors WHERE id = ?'
                )
                .bind(anonToken)
                .first();
            if (!visitor) {
                if (isPeek)
                    return new Response(
                        JSON.stringify({ access: 'granted', viewsLeft: 10 }),
                        { status: 200, headers }
                    );
                await env.vent_black
                    .prepare(
                        'INSERT INTO anonymous_visitors (id, problem_views) VALUES (?, 1)'
                    )
                    .bind(anonToken)
                    .run();
                return new Response(
                    JSON.stringify({ access: 'granted', viewsLeft: 9 }),
                    { status: 200, headers }
                );
            }
            if (visitor.problem_views >= 10) {
                return new Response(
                    JSON.stringify({
                        error: 'Limit reached',
                        requireAuth: true
                    }),
                    { status: 403, headers }
                );
            }
            if (!isPeek) {
                await env.vent_black
                    .prepare(
                        'UPDATE anonymous_visitors SET problem_views = problem_views + 1 WHERE id = ?'
                    )
                    .bind(anonToken)
                    .run();
                return new Response(
                    JSON.stringify({
                        access: 'granted',
                        viewsLeft: 9 - visitor.problem_views
                    }),
                    { status: 200, headers }
                );
            } else {
                return new Response(
                    JSON.stringify({
                        access: 'granted',
                        viewsLeft: 10 - visitor.problem_views
                    }),
                    { status: 200, headers }
                );
            }
        }
    });

    // 3. CSRF Token Generation
    router.get('/api/csrf-token', (): Response => {
        const token: string = crypto.randomUUID();
        let headers = new Headers({ 'Content-Type': 'application/json' });
        headers.set(
            'Set-Cookie',
            `csrf_token=${token}; Path=/; Max-Age=86400; SameSite=None; Secure`
        );
        return new Response(JSON.stringify({ csrfToken: token }), {
            status: 200,
            headers
        });
    });
}