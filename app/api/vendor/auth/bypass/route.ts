import { NextResponse } from 'next/server';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { getSettings } from '@/lib/settings';
import { isValidPhone, checkIpRateLimit } from '@/lib/otp';
import { createSessionToken, sessionCookieOptions } from '@/lib/vendor-session';

// Issues a vendor session WITHOUT OTP verification. Only works while the admin
// has explicitly enabled `otpBypass` in settings — the check is server-side so
// hiding the OTP screen in the UI can never be the whole gate.
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, mode } = body as { phone: string; mode: 'login' | 'register' };

        if (!checkIpRateLimit(request)) {
            return NextResponse.json({ error: 'Too many requests from this IP. Please try again later.' }, { status: 429 });
        }

        if (!isValidPhone(phone)) {
            return NextResponse.json({ error: 'Invalid phone number format. Must be +91 followed by 10 digits.' }, { status: 400 });
        }

        const settings = await getSettings();
        if (settings.otpBypass !== true) {
            return NextResponse.json({ error: 'OTP verification is required.' }, { status: 403 });
        }

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
        const hasApplication = !!existing.Item;

        if (mode === 'login' && !hasApplication) {
            return NextResponse.json({ error: 'No vendor application found for this number. Please register first.' }, { status: 404 });
        }

        const token = createSessionToken(phone);
        const cookie = sessionCookieOptions();

        const response = NextResponse.json({ success: true, hasApplication, bypass: true });
        response.cookies.set(cookie.name, token, {
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite,
            path: cookie.path,
            maxAge: cookie.maxAge,
        });
        return response;
    } catch (error: any) {
        console.error('Error in vendor OTP bypass:', error);
        return NextResponse.json({ error: 'Login failed', details: error.message }, { status: 500 });
    }
}
