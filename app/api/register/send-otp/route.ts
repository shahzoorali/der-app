import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { checkWhatsAppPresence } from '@/lib/whatsapp';

// Simple in-memory IP rate limiting
const ipRateLimit = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Ensure required environment variables exist
const AWS_REGION_OTP = process.env.AWS_REGION_OTP || 'us-east-1';
const ORIGINATION_NUMBER = '+18554651566';

const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
} : undefined;

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1', // Assuming tables are in main region
    credentials
});
const docClient = DynamoDBDocumentClient.from(ddbClient);

const smsClient = new PinpointSMSVoiceV2Client({
    region: AWS_REGION_OTP,
    credentials
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { phone } = body;

        // Note: For Next.js App Router API routes, getting the true client IP can be complex,
        // often relying on headers like x-forwarded-for. We use a fallback logic here.
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

        if (ip !== 'unknown') {
            const nowTime = Date.now();
            const record = ipRateLimit.get(ip);

            if (record) {
                if (nowTime > record.resetTime) {
                    ipRateLimit.set(ip, { count: 1, resetTime: nowTime + WINDOW_MS });
                } else if (record.count >= MAX_REQUESTS) {
                    return NextResponse.json({ error: 'Too many requests from this IP. Please try again later.' }, { status: 429 });
                } else {
                    record.count += 1;
                    ipRateLimit.set(ip, record);
                }
            } else {
                ipRateLimit.set(ip, { count: 1, resetTime: nowTime + WINDOW_MS });
            }
        }

        if (!phone || typeof phone !== 'string' || !/^\+91\d{10}$/.test(phone)) {
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
            TableName: 'DerDailyRegistrations',
            KeyConditionExpression: 'phone = :phone AND eventDay = :eventDay',
            ExpressionAttributeValues: {
                ':phone': phone,
                ':eventDay': safeEventDay
            }
        }));

        if (checkDuplicateResponse.Items && checkDuplicateResponse.Items.length > 0) {
            return NextResponse.json({ error: 'You have already registered for today. Please wait until tomorrow.' }, { status: 400 });
        }

        // Check WhatsApp Presence
        // checkWhatsAppPresence expects only the digits or standard format
        const isWhatsApp = await checkWhatsAppPresence(phone);

        if (isWhatsApp) {
            // Write a special bypassing OTP
            const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60; // 15 mins for them to finish registration

            await docClient.send(new PutCommand({
                TableName: 'DerOTPs',
                Item: {
                    phone,
                    otp: 'WHATSAPP_VERIFIED',
                    expiresAt,
                    createdAt: new Date().toISOString()
                }
            }));

            return NextResponse.json({ success: true, message: 'Verified seamlessly via WhatsApp', whatsappVerified: true });
        }

        // If not on WhatsApp, fallback to standard SMS OTP
        // Generate a 4-digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Expiration in 5 minutes
        const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;

        // Save to DynamoDB DerOTPs table
        await docClient.send(new PutCommand({
            TableName: 'DerOTPs',
            Item: {
                phone,
                otp,
                expiresAt,
                createdAt: new Date().toISOString()
            }
        }));

        // Send SMS via AWS End User Messaging (Pinpoint SMS Voice v2)
        const message = `Daawat-e-Ramzaan OTP is: ${otp}`;

        await smsClient.send(new SendTextMessageCommand({
            DestinationPhoneNumber: phone,
            OriginationIdentity: ORIGINATION_NUMBER,
            MessageBody: message,
            MessageType: 'TRANSACTIONAL'
        }));

        return NextResponse.json({ success: true, message: 'OTP sent successfully', whatsappVerified: false });
    } catch (error: any) {
        console.error('Error generating/sending OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 });
    }
}
