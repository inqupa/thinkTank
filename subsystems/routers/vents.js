// subsystems/routers/vents.js

export function registerVentRoutes(router) {
    // 1. Handle New Vent Submission
    router.post('/api/vent', async (request, env) => {
        const payload = await request.json();
        if (
            !payload.content ||
            typeof payload.content !== 'string' ||
            payload.content.trim().length === 0
        ) {
            return new Response(
                JSON.stringify({ error: 'Vent content cannot be empty.' }),
                { status: 400 }
            );
        }
        if (payload.content.length > 10000) {
            return new Response(
                JSON.stringify({
                    error: 'Vent is too long (max 10000 characters).'
                }),
                { status: 400 }
            );
        }

        const ventTrackingId = crypto.randomUUID();
        let solverId = null;
        let isTest = 0;
        const cookieHeader = request.headers.get('Cookie');

        if (cookieHeader) {
            if (cookieHeader.includes('vent_session='))
                solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
            if (cookieHeader.includes('vent_godmode=true')) isTest = 1;
        }

        await env.vent_black
            .prepare(
                'INSERT INTO vents (id, content, vent_month_year, solver_id, is_test) VALUES (?, ?, ?, ?, ?)'
            )
            .bind(
                ventTrackingId,
                payload.content,
                payload.vent_month_year,
                solverId,
                isTest
            )
            .run();

        return new Response(
            JSON.stringify({
                success: true,
                trackingId: ventTrackingId,
                message: 'Vent submitted securely.'
            }),
            { status: 200 }
        );
    });

    // 2. Fetch All Vents
    router.get('/api/vents', async (request, env) => {
        const { results } = await env.vent_black
            .prepare(
                'SELECT id, content, vent_month_year, created_at, is_test FROM vents ORDER BY created_at DESC'
            )
            .all();
        return new Response(JSON.stringify(results), { status: 200 });
    });

    // 3. Fetch Current User's Vents (The missing endpoint!)
    router.get('/api/user/vents', async (request, env) => {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session=')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401
            });
        }

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

    // 4. Delete a Vent
    router.delete('/api/vent/:id', async (request, env) => {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session='))
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401
            });

        const csrfHeader = request.headers.get('X-CSRF-Token');
        const csrfCookieMatch = cookieHeader.match(/csrf_token=([^;]+)/);
        if (
            !csrfHeader ||
            !csrfCookieMatch ||
            csrfHeader !== csrfCookieMatch[1]
        ) {
            return new Response(
                JSON.stringify({ error: 'Forbidden: CSRF token missing' }),
                { status: 403 }
            );
        }

        const solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
        const ventId = request.params.id;

        const targetVent = await env.vent_black
            .prepare('SELECT solver_id FROM vents WHERE id = ?')
            .bind(ventId)
            .first();
        if (!targetVent || targetVent.solver_id !== solverId)
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403
            });

        await env.vent_black
            .prepare('DELETE FROM vents WHERE id = ?')
            .bind(ventId)
            .run();
        return new Response(
            JSON.stringify({ success: true, message: 'Vent deleted.' }),
            { status: 200 }
        );
    });
}
