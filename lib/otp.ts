import { PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { PinpointSMSVoiceV2Client, SendTextMessageCommand } from '@aws-sdk/client-pinpoint-sms-voice-v2';
import { checkWhatsAppPresence, sendWhatsAppMessage, isWhatsAppConnected } from '@/lib/whatsapp';
import { docClient, TABLES, hasAwsCredentials } from '@/lib/dynamo';

const AWS_REGION_OTP = process.env.AWS_REGION_OTP || 'us-east-1';
const ORIGINATION_NUMBER = '+18554651566';

const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
} : undefined;

const smsClient = new PinpointSMSVoiceV2Client({
    region: AWS_REGION_OTP,
    credentials
});

// Simple in-memory IP rate limiting, shared across callers
const ipRateLimit = new Map<string, { count: number, resetTime: number }>();
const MAX_REQUESTS = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

export function checkIpRateLimit(request: Request): boolean {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';

    if (ip === 'unknown') return true;

    const nowTime = Date.now();
    const record = ipRateLimit.get(ip);

    if (record) {
        if (nowTime > record.resetTime) {
            ipRateLimit.set(ip, { count: 1, resetTime: nowTime + WINDOW_MS });
        } else if (record.count >= MAX_REQUESTS) {
            return false;
        } else {
            record.count += 1;
            ipRateLimit.set(ip, record);
        }
    } else {
        ipRateLimit.set(ip, { count: 1, resetTime: nowTime + WINDOW_MS });
    }
    return true;
}

export function isValidPhone(phone: string): boolean {
    return typeof phone === 'string' && /^\+91\d{10}$/.test(phone);
}

export async function sendOtp(phone: string, message = 'Daawat-e-Ramzaan OTP is:'): Promise<{ viaWhatsApp: boolean }> {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60; // 5 minutes
    const isDev = process.env.NODE_ENV !== 'production';

    // Prefer WhatsApp: when a session is connected and the number is on
    // WhatsApp, deliver the real OTP as a WhatsApp message. This is independent
    // of AWS — it only needs the linked WhatsApp session.
    if (isWhatsAppConnected()) {
        let onWhatsApp = false;
        try {
            onWhatsApp = await checkWhatsAppPresence(phone);
        } catch {
            onWhatsApp = false;
        }

        if (onWhatsApp && await sendWhatsAppMessage(phone, `${message} ${otp}`)) {
            await docClient.send(new PutCommand({
                TableName: TABLES.OTPS,
                Item: { phone, otp, channel: 'whatsapp', expiresAt, createdAt: new Date().toISOString() }
            }));
            if (isDev) console.log(`\n[DEV] WhatsApp OTP for ${phone}: ${otp}\n`);
            return { viaWhatsApp: true };
        }
        // Fall through to SMS if the number isn't on WhatsApp or the send failed.
    }

    // SMS fallback via AWS Pinpoint (production path for non-WhatsApp numbers).
    if (hasAwsCredentials) {
        await docClient.send(new PutCommand({
            TableName: TABLES.OTPS,
            Item: { phone, otp, channel: 'sms', expiresAt, createdAt: new Date().toISOString() }
        }));

        await smsClient.send(new SendTextMessageCommand({
            DestinationPhoneNumber: phone,
            OriginationIdentity: ORIGINATION_NUMBER,
            MessageBody: `${message} ${otp}`,
            MessageType: 'TRANSACTIONAL'
        }));

        return { viaWhatsApp: false };
    }

    // Last resort — local dev with no WhatsApp session and no AWS SMS: persist
    // the real OTP and print it to the server console so the flow stays testable.
    await docClient.send(new PutCommand({
        TableName: TABLES.OTPS,
        Item: { phone, otp, channel: 'dev', expiresAt, createdAt: new Date().toISOString() }
    }));
    console.log(`\n[DEV MODE] OTP for ${phone} is: ${otp}  (no WhatsApp session / no AWS SMS configured)\n`);
    return { viaWhatsApp: false };
}

export async function validateOtp(phone: string, otp: string): Promise<{ ok: true; channel: string } | { ok: false; error: string }> {
    const getOtpResponse = await docClient.send(new GetCommand({
        TableName: TABLES.OTPS,
        Key: { phone }
    }));

    const otpRecord = getOtpResponse.Item;

    if (!otpRecord) {
        return { ok: false, error: 'OTP not found. Please request a new one.' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > otpRecord.expiresAt) {
        await docClient.send(new DeleteCommand({ TableName: TABLES.OTPS, Key: { phone } }));
        return { ok: false, error: 'OTP has expired. Please request a new one.' };
    }

    if (otpRecord.otp !== otp) {
        return { ok: false, error: 'Invalid OTP.' };
    }

    return { ok: true, channel: otpRecord.channel || 'sms' };
}

export async function clearOtp(phone: string): Promise<void> {
    await docClient.send(new DeleteCommand({
        TableName: TABLES.OTPS,
        Key: { phone }
    }));
}
