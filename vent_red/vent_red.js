export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // Developer God Mode Toggle
    if (request.method === "GET" && url.pathname === "/api/dev/godmode") {
        const enable = url.searchParams.get('enable') === 'true';
        let responseHeaders = new Headers(corsHeaders);
        if (enable) {
            // Removed HttpOnly so frontend JS can see the warning banner
            responseHeaders.set("Set-Cookie", "vent_godmode=true; Path=/; Max-Age=31536000; SameSite=Lax");
            return new Response("God mode enabled.", { status: 200, headers: responseHeaders });
        } else {
            responseHeaders.set("Set-Cookie", "vent_godmode=; Path=/; Max-Age=0; SameSite=Lax");
            return new Response("God mode disabled.", { status: 200, headers: responseHeaders });
        }
    }

    // 1. Handle New Vent Submission (Unlimited, Anonymous, Trackable, with God Mode Check)
    if (request.method === "POST" && url.pathname === "/api/vent") {
        try {
            const payload = await request.json();
            const ventTrackingId = crypto.randomUUID(); 
            
            let solverId = null;
            let isTest = 0;

            const cookieHeader = request.headers.get('Cookie');

            if (cookieHeader) {
                // Check if normal registered user
                if (cookieHeader.includes('vent_session=')) {
                    solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
                }
                // Check if Admin in God Mode
                if (cookieHeader.includes('vent_godmode=true')) {
                    isTest = 1; // Quarantine this data
                }
            }
            
            // Save the vent
            await env.vent_black.prepare(
                "INSERT INTO vents (id, content, vent_month_year, solver_id, is_test) VALUES (?, ?, ?, ?, ?)"
            ).bind(ventTrackingId, payload.content, payload.vent_month_year, solverId, isTest).run();

            return new Response(JSON.stringify({ 
                success: true, 
                trackingId: ventTrackingId,
                message: "Vent submitted securely."
            }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
        }
    }

    // Enforce Problem Page Limit (Max 10 views for anonymous users)
    if (request.method === "GET" && url.pathname === "/api/problems/access") {
        const cookieHeader = request.headers.get('Cookie') || "";
        const isPeek = url.searchParams.get('peek') === 'true';
        
        if (cookieHeader.includes('vent_godmode=true')) {
            return new Response(JSON.stringify({ access: "granted", viewsLeft: "Infinite" }), { status: 200, headers: corsHeaders });
        }

        if (cookieHeader.includes('vent_session=')) {
            return new Response(JSON.stringify({ access: "granted" }), { status: 200, headers: corsHeaders });
        }

        let anonToken = null;
        if (cookieHeader.includes('anon_shadow=')) {
            anonToken = cookieHeader.split('anon_shadow=')[1].split(';')[0];
        }

        try {
            let responseHeaders = new Headers(corsHeaders);
            responseHeaders.set("Content-Type", "application/json");

            if (!anonToken) {
                if (isPeek) return new Response(JSON.stringify({ access: "granted", viewsLeft: 10 }), { status: 200, headers: responseHeaders });
                
                anonToken = crypto.randomUUID();
                await env.vent_black.prepare("INSERT INTO anonymous_visitors (id, problem_views) VALUES (?, 1)").bind(anonToken).run();
                responseHeaders.set("Set-Cookie", `anon_shadow=${anonToken}; HttpOnly; Path=/; Max-Age=31536000; SameSite=Lax`);
                return new Response(JSON.stringify({ access: "granted", viewsLeft: 9 }), { status: 200, headers: responseHeaders });
            } else {
                const visitor = await env.vent_black.prepare("SELECT problem_views FROM anonymous_visitors WHERE id = ?").bind(anonToken).first();
                
                if (!visitor) {
                    if (isPeek) return new Response(JSON.stringify({ access: "granted", viewsLeft: 10 }), { status: 200, headers: responseHeaders });
                    await env.vent_black.prepare("INSERT INTO anonymous_visitors (id, problem_views) VALUES (?, 1)").bind(anonToken).run();
                    return new Response(JSON.stringify({ access: "granted", viewsLeft: 9 }), { status: 200, headers: responseHeaders });
                }

                if (visitor.problem_views >= 10) {
                    return new Response(JSON.stringify({ error: "Limit reached", requireAuth: true }), { status: 403, headers: responseHeaders });
                }

                if (!isPeek) {
                    await env.vent_black.prepare("UPDATE anonymous_visitors SET problem_views = problem_views + 1 WHERE id = ?").bind(anonToken).run();
                    return new Response(JSON.stringify({ access: "granted", viewsLeft: 9 - visitor.problem_views }), { status: 200, headers: responseHeaders });
                } else {
                    return new Response(JSON.stringify({ access: "granted", viewsLeft: 10 - visitor.problem_views }), { status: 200, headers: responseHeaders });
                }
            }
        } catch (error) {
            return new Response(JSON.stringify({ error: "Server Error" }), { status: 500, headers: corsHeaders });
        }
    }

    // Handle Fetching All Vents
    if (request.method === "GET" && url.pathname === "/api/vents") {
        try {
            const { results } = await env.vent_black.prepare(
                "SELECT id, content, vent_month_year, created_at, is_test FROM vents ORDER BY created_at DESC"
            ).all();
            
            return new Response(JSON.stringify(results), {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "Server Error" }), { status: 500, headers: corsHeaders });
        }
    }

    // Handle Magic Link Generation (Login & Register)
    if (request.method === 'POST' && url.pathname === '/api/auth/magic-link') {
      try {
        const data = await request.json();
        const { email } = data;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
        }

        // 1. Ensure user exists (Register if new)
        const userCheck = await env.vent_black.prepare("SELECT id FROM solvers WHERE email = ?").bind(email).first();
        if (!userCheck) {
            const newId = crypto.randomUUID();
            await env.vent_black.prepare("INSERT INTO solvers (id, email) VALUES (?, ?)").bind(newId, email).run();
        }

        // 2. Generate a secure token and set expiration (15 minutes from now)
        // Using two UUIDs combined makes it harder to brute-force
        const token = crypto.randomUUID() + crypto.randomUUID(); 
        const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

        // 3. Save the token to the database
        await env.vent_black.prepare(
            "INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)"
        ).bind(token, email, expiresAt).run();

        // 4. "Send" the email (For local development, we output it directly)
        const magicLink = `http://localhost:8787/api/auth/verify?token=${token}`;
        console.log(`[EMAIL SIMULATOR] Send to ${email}: ${magicLink}`);

        return new Response(JSON.stringify({ 
            message: "Check your email for the login link!",
            dev_link: magicLink // Included for easy local testing
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error("Auth Error:", error.message);
        return new Response(JSON.stringify({ error: 'Failed to generate link' }), { status: 500 });
      }
    }

    // Handle Magic Link Verification
    if (request.method === 'GET' && url.pathname === '/api/auth/verify') {
      try {
          const token = url.searchParams.get('token');
          if (!token) return new Response("Missing token", { status: 400 });

          // 1. Verify token exists
          const linkRecord = await env.vent_black.prepare(
              "SELECT email, expires_at FROM magic_links WHERE token = ?"
          ).bind(token).first();

          if (!linkRecord) {
              return new Response("Invalid or already used link.", { status: 401 });
          }

          // 2. Check if expired
          if (new Date(linkRecord.expires_at) < new Date()) {
              await env.vent_black.prepare("DELETE FROM magic_links WHERE token = ?").bind(token).run();
              return new Response("Link expired. Please request a new one.", { status: 401 });
          }

          // 3. Get the user ID
          const user = await env.vent_black.prepare(
              "SELECT id FROM solvers WHERE email = ?"
          ).bind(linkRecord.email).first();

          // 4. Burn the token (Single-use security)
          await env.vent_black.prepare("DELETE FROM magic_links WHERE token = ?").bind(token).run();

          // 5. Log the user in via a secure HTTP-Only cookie and redirect to profile
          const cookie = `vent_session=${user.id}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`;
          
          return new Response(null, {
              status: 302,
              headers: {
                  'Location': '/skeleton/profile_placeholder.html',
                  'Set-Cookie': cookie
              }
          });
      } catch (error) {
          console.error("Verification Error:", error.message);
          return new Response("Server error during verification", { status: 500 });
      }
    }

    // Handle Fetching Current User
    if (request.method === 'GET' && url.pathname === '/api/user/me') {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session=')) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
        }

        const sessionId = cookieHeader.split('vent_session=')[1].split(';')[0];

        try {
            const user = await env.vent_black.prepare(
                "SELECT id, email, created_at FROM solvers WHERE id = ?"
            ).bind(sessionId).first();

            if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

            return new Response(JSON.stringify({
                name: user.email.split('@')[0],
                email: user.email,
                joined: user.created_at
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
        }
    }

    return new Response("Not Found", { status: 404 });
  }
};