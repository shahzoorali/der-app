import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from '@aws-sdk/client-pinpoint-sms-voice-v2';

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

        if (!phone || typeof phone !== 'string' || !/^\+91\d{10}$/.test(phone)) {
            return NextResponse.json({ error: 'Invalid phone number format. Must be +91 followed by 10 digits.' }, { status: 400 });
        }

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

        return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    } catch (error: any) {
        console.error('Error generating/sending OTP:', error);
        return NextResponse.json({ error: 'Failed to send OTP', details: error.message }, { status: 500 });
    }
}
