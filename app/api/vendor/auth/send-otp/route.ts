import { NextResponse } from 'next/server';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { sendOtp, checkIpRateLimit, isValidPhone } from '@/lib/otp';

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

        if (mode === 'login') {
            const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
            if (!existing.Item) {
                return NextResponse.json({ error: 'No vendor application found for this number. Please register first.' }, { status: 404 });
            }
        }

        const { viaWhatsApp } = await sendOtp(phone, 'Daawat-e-Ramzaan Vendor OTP is:');

        return NextResponse.json({
            success: true,
            message: viaWhatsApp ? 'OTP sent via WhatsApp' : 'OTP sent successfully',
            viaWhatsApp
        });
    } catch (error: any) {
        console.error('Error sending vendor OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 });
    }
}
