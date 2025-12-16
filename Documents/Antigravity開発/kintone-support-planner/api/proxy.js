export default async function handler(req, res) {
    const { subdomain, path } = req.query;

    if (!subdomain || !path) {
        return res.status(400).json({ error: 'Missing subdomain or path' });
    }

    // Target URL
    const targetUrl = `https://${subdomain}.cybozu.com/${path}`;

    // Preserve query parameters (excluding the internal ones we used for routing)
    const url = new URL(targetUrl);
    Object.keys(req.query).forEach(key => {
        if (key !== 'subdomain' && key !== 'path') {
            url.searchParams.append(key, req.query[key]);
        }
    });

    try {
        const response = await fetch(url.toString(), {
            method: req.method,
            headers: {
                'Content-Type': 'application/json',
                'X-Cybozu-API-Token': req.headers['x-cybozu-api-token'],
                // Pass other standard headers if needed
            },
            body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        });

        const data = await response.json();
        return res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
