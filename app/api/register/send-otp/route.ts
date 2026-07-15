import { NextResponse } from 'next/server';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { sendOtp, checkIpRateLimit, isValidPhone } from '@/lib/otp';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone } = body;

        if (!checkIpRateLimit(request)) {
            return NextResponse.json({ error: 'Too many requests from this IP. Please try again later.' }, { status: 429 });
        }

        if (!isValidPhone(phone)) {
            return NextResponse.json({ error: 'Invalid phone number format. Must be +91 followed by 10 digits.' }, { status: 400 });
        }

        // Check for duplicates for today
        const dt = new Date();
        const shiftedTime = new Date(dt.getTime() - (6.5 * 60 * 60 * 1000));
        const yyyyMmDd = shiftedTime.toISOString().split('T')[0];
        const startDayTime = new Date("2026-03-05T00:00:00Z").getTime();
        const currentDayTime = new Date(`${yyyyMmDd}T00:00:00Z`).getTime();
        const diffDays = Math.round((currentDayTime - startDayTime) / (1000 * 60 * 60 * 24));
        const eventDay = diffDays + 1;
        const safeEventDay = (eventDay >= 1 && eventDay <= 14) ? eventDay : 0;

        const checkDuplicateResponse = await docClient.send(new QueryCommand({
            TableName: TABLES.DAILY_REGISTRATIONS,
            KeyConditionExpression: 'phone = :phone AND eventDay = :eventDay',
            ExpressionAttributeValues: {
                ':phone': phone,
                ':eventDay': safeEventDay
            }
        }));

        if (checkDuplicateResponse.Items && checkDuplicateResponse.Items.length > 0) {
            return NextResponse.json({ error: 'You have already registered for today. Please wait until tomorrow.' }, { status: 400 });
        }

        const { viaWhatsApp } = await sendOtp(phone);

        return NextResponse.json({
            success: true,
            message: viaWhatsApp ? 'OTP sent via WhatsApp' : 'OTP sent successfully',
            viaWhatsApp
        });
    } catch (error: any) {
        console.error('Error generating/sending OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 });
    }
}
