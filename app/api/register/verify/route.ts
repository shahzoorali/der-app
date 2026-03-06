import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
} : undefined;

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1', // Assuming tables are in main region
    credentials
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone, otp, name, adults } = body;

        if (!phone || !otp || !name || typeof adults !== 'number') {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Fetch the OTP from DynamoDB
        const getOtpResponse = await docClient.send(new GetCommand({
            TableName: 'DerOTPs',
            Key: { phone }
        }));

        const otpRecord = getOtpResponse.Item;

        if (!otpRecord) {
            return NextResponse.json({ error: 'OTP not found. Please request a new one.' }, { status: 400 });
        }

        const now = Math.floor(Date.now() / 1000);
        if (now > otpRecord.expiresAt) {
            // Optional: delete expired OTP immediately
            await docClient.send(new DeleteCommand({ TableName: 'DerOTPs', Key: { phone } }));
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
        }

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

        // 2. OTP is valid, register the user in the multi-day table
        await docClient.send(new PutCommand({
            TableName: 'DerDailyRegistrations',
            Item: {
                phone,
                eventDay: safeEventDay,
                name,
                adults,
                registeredAt: dt.toISOString()
            }
        }));

        // 3. Clear the OTP so it can't be reused
        await docClient.send(new DeleteCommand({
            TableName: 'DerOTPs',
            Key: { phone }
        }));

        return NextResponse.json({ success: true, message: 'Registration successful' });
    } catch (error: any) {
        console.error('Error verifying OTP/Registering:', error);
        return NextResponse.json({ error: 'Registration failed', details: error.message }, { status: 500 });
    }
}
