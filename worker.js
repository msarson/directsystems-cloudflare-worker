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

            return new Response(`<!DOCTYPE html>
            <html>
            <head><title>Service Temporarily Unavailable</title></head>
            <body>
                <h1>Direct Systems is Temporarily Offline</h1>
                <p>Our office is currently experiencing network issues. We will be back online soon.</p>
                <p>Please check back later or contact us at <a href="mailto:support@directsystems.com">support@directsystems.com</a></p>
            </body>
            </html>`, {
                headers: { "Content-Type": "text/html" },
                status: 503
            });
        }
    }
};
