export default {
    async fetch(request, env, ctx) {
        let host = new URL(request.url).hostname;
        let originURL = `https://${host}`;

        try {
            // Ensure correct headers (strip out Cloudflare-specific ones)
            let modifiedHeaders = new Headers(request.headers);
            modifiedHeaders.delete("cf-connecting-ip");
            modifiedHeaders.delete("cf-ray");
            modifiedHeaders.delete("cf-visitor");

            const response = await fetch(originURL, {
                method: request.method,
                headers: modifiedHeaders
            });

            if (response.ok) {
                return response;
            } else {
                throw new Error(`Fetch failed with status: ${response.status}`);
            }
        } catch (error) {
            console.error("Worker Error:", error); // Logs error in Cloudflare Worker console

            // Fetch and return the hosted failover page from GitHub Pages
            return fetch("https://msarson.github.io/directsystems-cloudflare-worker/static/failover.html");
        }
    }
};
