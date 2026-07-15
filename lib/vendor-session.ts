import crypto from 'crypto';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
const COOKIE_NAME = 'vendor_session';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function base64url(input: Buffer | string): string {
    return Buffer.from(input).toString('base64url');
}

function sign(payload: string): string {
    return crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
}

export function createSessionToken(phone: string): string {
    const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS;
    const payload = base64url(JSON.stringify({ phone, exp }));
    const signature = sign(payload);
    return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): string | null {
    if (!token) return null;
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSignature = sign(payload);
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
    }

    try {
        const { phone, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
        if (typeof exp !== 'number' || Math.floor(Date.now() / 1000) > exp) return null;
        return phone;
    } catch {
        return null;
    }
}

export function sessionCookieOptions() {
    return {
        name: COOKIE_NAME,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        maxAge: MAX_AGE_SECONDS,
    };
}

export { COOKIE_NAME };

export function getVendorPhoneFromRequest(request: Request): string | null {
    const cookieHeader = request.headers.get('cookie') || '';
    const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!match) return null;
    const token = decodeURIComponent(match.split('=').slice(1).join('='));
    return verifySessionToken(token);
}
