export default {
    async fetch(request, env, ctx) {
        let host = new URL(request.url).hostname;
        let originURL = `https://${host}`;

        try {
            // Try fetching from the original server
            const response = await fetch(originURL, {
                method: request.method,
                headers: request.headers
            });

            // If response is good, return the original content
            if (response.ok) {
                return response;
            }
        } catch (error) {
            // If request fails (server offline), serve the failover page
            return new Response(`<!DOCTYPE html>
            <html>
            <head><title>Our Service Temporarily Unavailable</title></head>
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
