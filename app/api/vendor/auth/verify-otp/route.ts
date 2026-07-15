import { NextResponse } from 'next/server';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { validateOtp, clearOtp } from '@/lib/otp';
import { createSessionToken, sessionCookieOptions } from '@/lib/vendor-session';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, otp } = body;

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await validateOtp(phone, otp);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }

        await clearOtp(phone);

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
        const hasApplication = !!existing.Item;

        const token = createSessionToken(phone);
        const cookie = sessionCookieOptions();

        const response = NextResponse.json({ success: true, hasApplication });
        response.cookies.set(cookie.name, token, {
            httpOnly: cookie.httpOnly,
            secure: cookie.secure,
            sameSite: cookie.sameSite,
            path: cookie.path,
            maxAge: cookie.maxAge,
        });
        return response;
    } catch (error: any) {
        console.error('Error verifying vendor OTP:', error);
        return NextResponse.json({ error: 'Verification failed', details: error.message }, { status: 500 });
    }
}
