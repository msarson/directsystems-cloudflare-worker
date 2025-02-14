export default {
    async fetch(request, env, ctx) {
        let url = new URL(request.url);
        let originURL = `https://${url.hostname}${url.pathname}${url.search}`; // Preserve full path & query params

        try {
            // Log incoming request details
            console.log(`Incoming request: ${request.method} ${url.href}`);

            // Ensure correct headers (strip out Cloudflare-specific ones)
            let modifiedHeaders = new Headers(request.headers);
            modifiedHeaders.delete("cf-connecting-ip");
            modifiedHeaders.delete("cf-ray");
            modifiedHeaders.delete("cf-visitor");

            // Include request method and body (for POST/PUT)
            let fetchOptions = {
                method: request.method,
                headers: modifiedHeaders,
                body: request.method !== "GET" && request.method !== "HEAD" ? await request.text() : null
            };

            const response = await fetch(originURL, fetchOptions);

            if (response.ok) {
                console.log(`✅ Request succeeded: ${url.href} (Status: ${response.status})`);
                return response;
            } else {
                throw new Error(`⚠️ Fetch failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Worker Error: ${error.message} | Request: ${request.method} ${url.href}`);

            // Handle static assets separately
            if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|css|js|woff|woff2|ttf|eot|ico)$/i)) {
                console.warn(`⚠️ Static asset failover triggered for: ${url.href}`);

                // Redirect missing static files to GitHub Pages version
                let failoverAssetURL = `https://msarson.github.io/directsystems-cloudflare-worker${url.pathname}`;
                return fetch(failoverAssetURL);
            }

            // If the request is for `/directservice`, return API-specific failover response
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

            // Log if it's a normal web request failure
            console.warn(`⚠️ Website Failover Triggered for: ${url.href}`);

            return fetch("https://msarson.github.io/directsystems-cloudflare-worker/static/failover.html");
        }
    }
};
