export default {
    async fetch(request, env, ctx) {
        let url = new URL(request.url);
        let originURL = `https://www.directsystems.com${url.pathname}${url.search}`;

        console.log(`🔹 Incoming request: ${request.method} ${url.href}`);
        console.log(`🔹 Forwarding request to: ${originURL}`);

        try {
            let modifiedHeaders = new Headers(request.headers);

            // Preserve original client IP
            if (request.headers.has("X-Forwarded-For")) {
                modifiedHeaders.set("CF-Connecting-IP", request.headers.get("X-Forwarded-For"));
                console.log(`✅ Forwarded IP: ${request.headers.get("X-Forwarded-For")}`);
            }

            // Remove Cloudflare-specific headers
            modifiedHeaders.delete("cf-ray");
            modifiedHeaders.delete("cf-visitor");

            let fetchOptions = {
                method: request.method,
                headers: modifiedHeaders,
                body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : null
            };

            // Fetch the real site
            const response = await fetch(originURL, fetchOptions);

            if (response.ok) {
                console.log(`✅ Request succeeded: ${url.href} (Status: ${response.status})`);
                return response;
            }

            // Explicitly handle Cloudflare-origin errors
            if ([521, 522, 523, 524, 525, 526].includes(response.status)) {
                console.warn(`⚠️ Cloudflare Error ${response.status} Detected - Serving Failover`);
                return fetch("https://msarson.github.io/directsystems-cloudflare-pages/failover.html");
            }

            console.warn(`⚠️ Non-200 response: ${response.status}`);
            return response; // Pass through other errors

        } catch (error) {
            console.error(`❌ Worker Error: ${error.message} | Request: ${request.method} ${url.href}`);

            // Handle static assets separately
            if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|eot|ico)$/i)) {
                console.warn(`⚠️ Static asset failover triggered for: ${url.href}`);
                return fetch(`https://msarson.github.io/directsystems-cloudflare-pages${url.pathname}`);
            }

            // API failover response
            if (url.pathname.startsWith("/directservice")) {
                console.warn(`⚠️ API Failover Triggered for: ${url.href}`);
                return new Response(JSON.stringify({
                    error: "Service temporarily unavailable",
                    message: "The Direct Systems API is currently offline due to network issues.",
                    status: 503
                }), {
                    headers: { "Content-Type": "application/json" },
                    status: 503
                });
            }

            // Website failover fallback
            console.warn(`⚠️ Website Failover Triggered for: ${url.href}`);
            return fetch("https://msarson.github.io/directsystems-cloudflare-pages/failover.html");
        }
    }
};
