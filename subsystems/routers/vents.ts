// subsystems/routers/vents.ts

// --- TYPE DEFINITIONS ---
interface Env {
    vent_black: any; // Cloudflare D1 Database binding
}

interface VentPayload {
    content?: string;
    vent_month_year?: string;
    [key: string]: any;
}

// Extends the standard web Request to include routing parameters (e.g., request.params.id)
interface RouterRequest extends Request {
    params?: {
        id?: string;
        [key: string]: string | undefined;
    };
}

export function registerVentRoutes(router: any): void {
    // 1. Handle New Vent Submission
    router.post('/api/vent', async (request: RouterRequest, env: Env): Promise<Response> => {
        const payload: VentPayload = await request.json();
        if (
            !payload.content ||
            typeof payload.content !== 'string' ||
            payload.content.trim().length === 0
        ) {
            return new Response(
                JSON.stringify({ error: 'Vent content cannot be empty.' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }
        if (payload.content.length > 10000) {
            return new Response(
                JSON.stringify({
                    error: 'Vent is too long (max 10000 characters).'
                }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const ventTrackingId: string = crypto.randomUUID();
        let solverId: string | null = null;
        let isTest: number = 0;
        const cookieHeader: string | null = request.headers.get('Cookie');

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
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    });

    // 2. Fetch All Vents
    router.get('/api/vents', async (_request: RouterRequest, env: Env): Promise<Response> => {
        const { results } = await env.vent_black
            .prepare(
                'SELECT id, content, vent_month_year, created_at, is_test FROM vents ORDER BY created_at DESC'
            )
            .all();
        return new Response(JSON.stringify(results), { 
            status: 200, 
            headers: { 'Content-Type': 'application/json' } 
        });
    });

    // 3. Fetch Current User's Vents (The missing endpoint!)
    router.get('/api/user/vents', async (request: RouterRequest, env: Env): Promise<Response> => {
        const cookieHeader: string | null = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session=')) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });
        }

        const solverId: string = cookieHeader.split('vent_session=')[1].split(';')[0];
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
    router.delete('/api/vent/:id', async (request: RouterRequest, env: Env): Promise<Response> => {
        const cookieHeader: string | null = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session='))
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' }
            });

        const csrfHeader: string | null = request.headers.get('X-CSRF-Token');
        const csrfCookieMatch = cookieHeader.match(/csrf_token=([^;]+)/);
        if (
            !csrfHeader ||
            !csrfCookieMatch ||
            csrfHeader !== csrfCookieMatch[1]
        ) {
            return new Response(
                JSON.stringify({ error: 'Forbidden: CSRF token missing' }),
                { status: 403, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const solverId: string = cookieHeader.split('vent_session=')[1].split(';')[0];
        const ventId: string | undefined = request.params?.id;

        if (!ventId) {
            return new Response(JSON.stringify({ error: 'Bad Request: Vent ID missing' }), {
                status: 400, headers: { 'Content-Type': 'application/json' }
            });
        }

        const targetVent: any = await env.vent_black
            .prepare('SELECT solver_id FROM vents WHERE id = ?')
            .bind(ventId)
            .first();
            
        if (!targetVent || targetVent.solver_id !== solverId)
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
                status: 403, headers: { 'Content-Type': 'application/json' }
            });

        await env.vent_black
            .prepare('DELETE FROM vents WHERE id = ?')
            .bind(ventId)
            .run();
            
        return new Response(
            JSON.stringify({ success: true, message: 'Vent deleted.' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    });
}