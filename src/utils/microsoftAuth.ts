export async function requestMicrosoftGraphJwt(): Promise<string> {
    const tenantId = process.env.TENANT_ID;
    const clientId = process.env.CLIENT_ID;
    const clientSecret = process.env.CLIENT_SECRET;
    const scope = 'https://graph.microsoft.com/.default';

    if (!tenantId || !clientId || !clientSecret) {
        throw new Error('Missing required environment variables.');
    }

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope,
        grant_type: 'client_credentials',
    });

    const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch JWT: ${error}`);
    }

    const data = await response.json() as { access_token: string };
    return data.access_token;
}