import { NextResponse } from 'next/server';
import { validateOtp } from '@/lib/otp';

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

        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (error: any) {
        console.error('Error validating OTP:', error);
        return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 500 });
    }
}
