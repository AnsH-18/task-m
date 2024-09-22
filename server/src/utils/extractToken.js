export function extractAccessToken(cookieHeader) {
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'accessToken') {
        return value;
        }
    }
    return null;
    }