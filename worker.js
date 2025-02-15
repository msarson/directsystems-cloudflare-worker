export default {
    async fetch(request, env, ctx) {
        let url = new URL(request.url);

        // Define the primary backend URL (your main service)
        let primaryService = `https://${url.hostname}${url.pathname}${url.search}`;

        // Define GitHub Pages failover URL
        let failoverPage = "https://msarson.github.io/directsystems-cloudflare-pages/failover.html";

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

            // Try fetching the primary service
            const response = await fetch(primaryService, fetchOptions);

            if (response.ok) {
                console.log(`✅ Request succeeded: ${url.href} (Status: ${response.status})`);
                return response;
            } else {
                throw new Error(`⚠️ Fetch failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Worker Error: ${error.message} | Request: ${request.method} ${url.href}`);

            // If offline, serve the GitHub Pages failover page
            console.warn(`⚠️ Serving failover page: ${failoverPage}`);
            return fetch(failoverPage);
        }
    }
};
