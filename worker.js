export default {
    async fetch(request, env, ctx) {
        let host = new URL(request.url).hostname;
        let originURL = `https://${host}`;

        try {
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
            console.error("Worker Error:", error);

            return new Response(`<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Service Temporarily Unavailable</title>
                <link rel="stylesheet" href="https://msarson.github.io/directsystems-cloudflare-worker/static/styles.css">
            </head>
            <body>
                <div class="container">
                    <h1>Direct Systems is Temporarily Offline</h1>
                    <p>Our office is currently experiencing network issues. We will be back online soon.</p>
                    <p>Please check back later or contact us at <a href="mailto:support@directsystems.com">support@directsystems.com</a></p>
                </div>
            </body>
            </html>`, {
                headers: { "Content-Type": "text/html" },
                status: 503
            });
        }
    }
};
