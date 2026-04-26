// subsystems/routers/system.js

export function registerSystemRoutes(router) {
    // 1. Developer God Mode Toggle
    router.get('/api/dev/godmode', (request, env, url) => {
        const enable = url.searchParams.get('enable') === 'true';
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
    router.get('/api/problems/access', async (request, env, url) => {
        const cookieHeader = request.headers.get('Cookie') || '';
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

        let anonToken = null;
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
            const visitor = await env.vent_black
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
    router.get('/api/csrf-token', () => {
        const token = crypto.randomUUID();
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
