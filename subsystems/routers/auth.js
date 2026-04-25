// subsystems/routers/auth.js

export function registerAuthRoutes(router) {
    // 1. Handle Magic Link Generation
    router.post('/api/auth/magic-link', async (request, env) => {
        const data = await request.json();
        const { email } = data;

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email) || email.length > 100) {
            return new Response(
                JSON.stringify({ error: 'Valid email required' }),
                { status: 400 }
            );
        }

        const recentLink = await env.vent_black
            .prepare(
                'SELECT created_at FROM magic_links WHERE email = ? ORDER BY created_at DESC LIMIT 1'
            )
            .bind(email)
            .first();
        if (recentLink) {
            const dbTimeUTC = new Date(recentLink.created_at + 'Z').getTime();
            const timeSinceLastLink = Date.now() - dbTimeUTC;
            if (timeSinceLastLink < 60000) {
                return new Response(
                    JSON.stringify({
                        error: 'Please wait 60 seconds before requesting another link.'
                    }),
                    { status: 429 }
                );
            }
        }

        const userCheck = await env.vent_black
            .prepare('SELECT id FROM solvers WHERE email = ?')
            .bind(email)
            .first();
        if (!userCheck) {
            const newId = crypto.randomUUID();
            await env.vent_black
                .prepare('INSERT INTO solvers (id, email) VALUES (?, ?)')
                .bind(newId, email)
                .run();
        }

        const token = crypto.randomUUID() + crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
        await env.vent_black
            .prepare(
                'INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)'
            )
            .bind(token, email, expiresAt)
            .run();

        const magicLink = `http://localhost:8787/api/auth/verify?token=${token}`;
        console.log(`[EMAIL SIMULATOR] Send to ${email}: ${magicLink}`);
        return new Response(
            JSON.stringify({
                message: 'Check your email for the login link!',
                dev_link: magicLink
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    });

    // 2. Handle Magic Link Verification
    router.get('/api/auth/verify', async (request, env, url) => {
        const token = url.searchParams.get('token');
        if (!token) return new Response('Missing token', { status: 400 });

        const linkRecord = await env.vent_black
            .prepare(
                'SELECT email, expires_at FROM magic_links WHERE token = ?'
            )
            .bind(token)
            .first();
        if (!linkRecord)
            return new Response('Invalid or already used link.', {
                status: 401
            });

        if (new Date(linkRecord.expires_at) < new Date()) {
            await env.vent_black
                .prepare('DELETE FROM magic_links WHERE token = ?')
                .bind(token)
                .run();
            return new Response('Link expired. Please request a new one.', {
                status: 401
            });
        }

        const user = await env.vent_black
            .prepare('SELECT id FROM solvers WHERE email = ?')
            .bind(linkRecord.email)
            .first();
        await env.vent_black
            .prepare('DELETE FROM magic_links WHERE token = ?')
            .bind(token)
            .run();

        const cookie = `vent_session=${user.id}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`;
        return new Response(null, {
            status: 302,
            headers: {
                Location: '/skeleton/profile_placeholder.html',
                'Set-Cookie': cookie
            }
        });
    });

    // 3. Fetch Current User
    router.get('/api/user/me', async (request, env) => {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session='))
            return new Response(
                JSON.stringify({ error: 'Not authenticated' }),
                { status: 401 }
            );

        const sessionId = cookieHeader.split('vent_session=')[1].split(';')[0];
        const user = await env.vent_black
            .prepare('SELECT id, email, created_at FROM solvers WHERE id = ?')
            .bind(sessionId)
            .first();

        if (!user)
            return new Response(JSON.stringify({ error: 'User not found' }), {
                status: 404
            });
        return new Response(
            JSON.stringify({
                name: user.email.split('@')[0],
                email: user.email,
                joined: user.created_at
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
    });
}
