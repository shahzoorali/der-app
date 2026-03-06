import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

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
        const { phone, otp } = body;

        if (!phone || !otp) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Fetch the OTP from DynamoDB
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
            return NextResponse.json({ error: 'OTP has expired. Please request a new one.' }, { status: 400 });
        }

        if (otpRecord.otp !== otp) {
            return NextResponse.json({ error: 'Invalid OTP.' }, { status: 400 });
        }

        return NextResponse.json({ success: true, message: 'OTP verified successfully' });
    } catch (error: any) {
        console.error('Error validating OTP:', error);
        return NextResponse.json({ error: 'Validation failed', details: error.message }, { status: 500 });
    }
}
