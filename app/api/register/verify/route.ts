import { NextResponse } from 'next/server';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { validateOtp, clearOtp } from '@/lib/otp';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, otp, name, adults } = body;

        if (!phone || !otp || !name || typeof adults !== 'number') {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const result = await validateOtp(phone, otp);
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        const whatsappExists = result.channel === 'whatsapp';

        // Calculate Event Day (1-14) based on 6PM to 3AM operational shift
        const dt = new Date();
        const shiftedTime = new Date(dt.getTime() - (6.5 * 60 * 60 * 1000));
        const yyyyMmDd = shiftedTime.toISOString().split('T')[0];

        // Based on Mar 5th being Day 1
        const startDayTime = new Date("2026-03-05T00:00:00Z").getTime();
        const currentDayTime = new Date(`${yyyyMmDd}T00:00:00Z`).getTime();

        const diffDays = Math.round((currentDayTime - startDayTime) / (1000 * 60 * 60 * 24));
        const eventDay = diffDays + 1; // E.g., Day 1, Day 2
        const safeEventDay = (eventDay >= 1 && eventDay <= 14) ? eventDay : 0; // 0 for out-of-bounds tests

        // OTP is valid, register the user in the multi-day table
        await docClient.send(new PutCommand({
            TableName: TABLES.DAILY_REGISTRATIONS,
            Item: {
                phone,
                eventDay: safeEventDay,
                name,
                adults,
                whatsapp_exists: whatsappExists,
                verified: true,
                registeredAt: dt.toISOString()
            }
        }));

        // Clear the OTP so it can't be reused
        await clearOtp(phone);

        return NextResponse.json({ success: true, message: 'Registration successful' });
    } catch (error: any) {
        console.error('Error verifying OTP/Registering:', error);
        return NextResponse.json({ error: 'Registration failed', details: error.message }, { status: 500 });
    }
}
