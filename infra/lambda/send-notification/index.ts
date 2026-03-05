import { DynamoDBClient, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import * as crypto from 'crypto';
import * as https from 'https';
import * as url from 'url';

const ddb = new DynamoDBClient({});
const sm = new SecretsManagerClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const VAPID_SECRET_ARN = process.env.VAPID_SECRET_ARN!;

// Timetable data embedded at deploy time
const TIMETABLE: Array<{ day: number; fullDate: string; suhoor: string; iftar: string }> =
    JSON.parse(process.env.TIMETABLE_JSON || '[]');

// ── Types ──────────────────────────────────────────────────────────────

interface NotificationPayload {
    title: string;
    body: string;
}

interface PushSubscription {
    endpoint: string;
    p256dh: string;
    auth: string;
}

interface VapidKeys {
    publicKey: string;
    privateKey: string;
    subject: string;
}

// ── VAPID / Web Push Implementation ────────────────────────────────────

let cachedVapidKeys: VapidKeys | null = null;

async function getVapidKeys(): Promise<VapidKeys> {
    if (cachedVapidKeys) return cachedVapidKeys;
    const result = await sm.send(new GetSecretValueCommand({ SecretId: VAPID_SECRET_ARN }));
    cachedVapidKeys = JSON.parse(result.SecretString!);
    return cachedVapidKeys!;
}

function base64urlEncode(buffer: Buffer): string {
    return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str: string): Buffer {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    const padding = (4 - (str.length % 4)) % 4;
    str += '='.repeat(padding);
    return Buffer.from(str, 'base64');
}

/**
 * Create a signed VAPID JWT for the push service
 */
function createVapidJwt(audience: string, subject: string, privateKeyBase64: string, expSeconds = 86400): string {
    const header = base64urlEncode(Buffer.from(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
    const now = Math.floor(Date.now() / 1000);
    const payload = base64urlEncode(Buffer.from(JSON.stringify({
        aud: audience,
        exp: now + expSeconds,
        sub: subject,
    })));

    const unsignedToken = `${header}.${payload}`;
    const privateKeyBuffer = base64urlDecode(privateKeyBase64);

    // Convert raw 32-byte private key to PEM-formatted PKCS8
    const privateKeyDer = Buffer.concat([
        Buffer.from('30770201010420', 'hex'),    // SEQUENCE, INTEGER (version), OCTET STRING
        privateKeyBuffer,                          // 32 bytes private key
        Buffer.from('a00a06082a8648ce3d030107a14403420004', 'hex'),  // curve OID + public key tag
        Buffer.alloc(64),  // placeholder - we won't need the public key for signing
    ]);

    // Use the raw key directly with createSign
    const sign = crypto.createSign('SHA256');
    sign.update(unsignedToken);

    // Create the EC private key in JWK format for signing
    const jwk = {
        kty: 'EC',
        crv: 'P-256',
        d: privateKeyBase64,
    };

    const keyObject = crypto.createPrivateKey({
        key: jwk,
        format: 'jwk',
    });

    const signature = sign.sign({ key: keyObject, dsaEncoding: 'ieee-p1363' });
    return `${unsignedToken}.${base64urlEncode(signature)}`;
}

/**
 * Encrypt the push message payload using the subscription keys
 * Implements RFC 8291 (Message Encryption for Web Push) with aes128gcm
 */
function encryptPayload(subscription: PushSubscription, payload: string): { body: Buffer; contentEncoding: string } {
    const p256dhBuffer = base64urlDecode(subscription.p256dh);
    const authBuffer = base64urlDecode(subscription.auth);

    // Generate a local ECDH key pair
    const localKeys = crypto.createECDH('prime256v1');
    localKeys.generateKeys();

    // Create the shared secret
    const sharedSecret = localKeys.computeSecret(p256dhBuffer);

    // Generate a random 16-byte salt
    const salt = crypto.randomBytes(16);

    // Derive keys using HKDF
    const authInfo = Buffer.from('Content-Encoding: auth\0', 'utf8');
    const prk = hkdf(authBuffer, sharedSecret, authInfo, 32);

    const context = Buffer.concat([
        Buffer.from('P-256\0', 'utf8'),
        // Recipient public key length + key
        Buffer.from([0, 65]), p256dhBuffer,
        // Sender public key length + key
        Buffer.from([0, 65]), localKeys.getPublicKey(),
    ]);

    const contentEncryptionKeyInfo = Buffer.concat([
        Buffer.from('Content-Encoding: aes128gcm\0', 'utf8'),
        context,
    ]);
    const nonceInfo = Buffer.concat([
        Buffer.from('Content-Encoding: nonce\0', 'utf8'),
        context,
    ]);

    const contentEncryptionKey = hkdf(salt, prk, contentEncryptionKeyInfo, 16);
    const nonce = hkdf(salt, prk, nonceInfo, 12);

    // Encrypt with AES-128-GCM
    const paddedPayload = Buffer.concat([Buffer.from(payload, 'utf8'), Buffer.from([2])]);  // padding delimiter
    const cipher = crypto.createCipheriv('aes-128-gcm', contentEncryptionKey, nonce);
    const encrypted = Buffer.concat([cipher.update(paddedPayload), cipher.final(), cipher.getAuthTag()]);

    // Build the aes128gcm content coding header
    const recordSize = Buffer.alloc(4);
    recordSize.writeUInt32BE(encrypted.length + 17 + 1, 0);  // + header overhead

    const header = Buffer.concat([
        salt,                                    // 16 bytes
        recordSize,                               // 4 bytes
        Buffer.from([65]),                        // key length (1 byte)
        localKeys.getPublicKey(),                 // 65 bytes (uncompressed point)
    ]);

    return {
        body: Buffer.concat([header, encrypted]),
        contentEncoding: 'aes128gcm',
    };
}

function hkdf(salt: Buffer, ikm: Buffer, info: Buffer, length: number): Buffer {
    const prk = crypto.createHmac('sha256', salt).update(ikm).digest();
    const infoHmac = crypto.createHmac('sha256', prk).update(Buffer.concat([info, Buffer.from([1])])).digest();
    return infoHmac.subarray(0, length);
}

/**
 * Send a push notification to a single subscription
 */
async function sendWebPush(subscription: PushSubscription, payload: NotificationPayload, vapidKeys: VapidKeys): Promise<boolean> {
    const payloadStr = JSON.stringify(payload);
    const encrypted = encryptPayload(subscription, payloadStr);

    const parsedUrl = new url.URL(subscription.endpoint);
    const audience = `${parsedUrl.protocol}//${parsedUrl.host}`;

    const jwt = createVapidJwt(audience, vapidKeys.subject, vapidKeys.privateKey);
    const vapidPublicKeyUrlSafe = vapidKeys.publicKey;

    return new Promise((resolve) => {
        const data = encrypted.body;
        const req = https.request(subscription.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Encoding': encrypted.contentEncoding,
                'Content-Length': data.length.toString(),
                'TTL': '86400',
                'Urgency': 'high',
                'Authorization': `vapid t=${jwt}, k=${vapidPublicKeyUrlSafe}`,
            },
        }, (res) => {
            let body = '';
            res.on('data', (chunk: string) => body += chunk);
            res.on('end', () => {
                if (res.statusCode === 201) {
                    resolve(true);
                } else if (res.statusCode === 404 || res.statusCode === 410) {
                    // Subscription expired or invalid — delete it
                    console.warn(`Stale subscription (${res.statusCode}): ${subscription.endpoint.substring(0, 40)}...`);
                    resolve(false);
                } else {
                    console.error(`Push failed (${res.statusCode}): ${body}`);
                    resolve(true); // Don't delete on transient errors
                }
            });
        });
        req.on('error', (err) => {
            console.error(`Push request error: ${err.message}`);
            resolve(true);
        });
        req.write(data);
        req.end();
    });
}

// ── Token Management ───────────────────────────────────────────────────

async function getAllSubscriptions(): Promise<PushSubscription[]> {
    const subs: PushSubscription[] = [];
    let lastKey: any = undefined;

    do {
        const result = await ddb.send(new ScanCommand({
            TableName: TABLE_NAME,
            ExclusiveStartKey: lastKey,
        }));

        if (result.Items) {
            for (const item of result.Items) {
                subs.push({
                    endpoint: item.endpoint.S!,
                    p256dh: item.p256dh.S!,
                    auth: item.auth.S!,
                });
            }
        }

        lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    return subs;
}

async function deleteSubscription(endpoint: string): Promise<void> {
    await ddb.send(new DeleteItemCommand({
        TableName: TABLE_NAME,
        Key: { endpoint: { S: endpoint } },
    }));
    console.log(`Deleted stale subscription: ${endpoint.substring(0, 40)}...`);
}

// ── Notification Content ───────────────────────────────────────────────

function getSuhoorNotification(): NotificationPayload {
    const today = new Date().toISOString().split('T')[0];
    const entry = TIMETABLE.find(t => t.fullDate === today);
    if (entry) {
        return {
            title: '🌙 Suhoor Reminder',
            body: `Suhoor time is at ${formatTime(entry.suhoor)} today (Day ${entry.day}). Please complete your Suhoor before time ends.`,
        };
    }
    return { title: '🌙 Suhoor Reminder', body: 'It is time for Suhoor. Please complete your meal.' };
}

function getIftarNotification(): NotificationPayload {
    const today = new Date().toISOString().split('T')[0];
    const entry = TIMETABLE.find(t => t.fullDate === today);
    if (entry) {
        return {
            title: '🌅 Iftar Time!',
            body: `Iftar time is at ${formatTime(entry.iftar)} today (Day ${entry.day}). Wishing you a blessed Iftar!`,
        };
    }
    return { title: '🌅 Iftar Time!', body: 'It is time for Iftar. Wishing you a blessed Iftar!' };
}

function formatTime(time24: string): string {
    const [hours, minutes] = time24.split(':').map(Number);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const h = hours % 12 || 12;
    return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
}

// ── Main Handler ───────────────────────────────────────────────────────

export const handler = async (event: any) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };

    try {
        let notification: NotificationPayload;

        // Determine notification type from event
        if (event.requestContext?.http?.method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        if (event.body) {
            // Admin API call via API Gateway
            const body = JSON.parse(event.body);
            if (!body.title || !body.body) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing title or body' }) };
            }
            notification = { title: body.title, body: body.body };
            console.log(`Admin notification: ${notification.title}`);
        } else {
            // EventBridge Scheduler / direct invocation
            const detail = event.detail || event;
            if (detail.type === 'suhoor') {
                notification = getSuhoorNotification();
            } else if (detail.type === 'iftar') {
                notification = getIftarNotification();
            } else if (detail.title && detail.body) {
                notification = { title: detail.title, body: detail.body };
            } else {
                console.error('Cannot determine notification from event:', JSON.stringify(event));
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid event' }) };
            }
        }

        // Get all subscriptions
        const subscriptions = await getAllSubscriptions();
        console.log(`Sending to ${subscriptions.length} subscriptions`);

        if (subscriptions.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, message: 'No subscriptions' }) };
        }

        // Get VAPID keys
        const vapidKeys = await getVapidKeys();

        let sent = 0;
        let failed = 0;
        const stale: string[] = [];

        // Process in batches of 10
        const batchSize = 10;
        for (let i = 0; i < subscriptions.length; i += batchSize) {
            const batch = subscriptions.slice(i, i + batchSize);
            await Promise.allSettled(
                batch.map(async (sub) => {
                    const ok = await sendWebPush(sub, notification, vapidKeys);
                    if (ok) { sent++; } else { failed++; stale.push(sub.endpoint); }
                })
            );
        }

        // Clean up stale subscriptions
        if (stale.length > 0) {
            console.log(`Cleaning up ${stale.length} stale subscriptions`);
            await Promise.allSettled(stale.map(e => deleteSubscription(e)));
        }

        const result = { success: true, sent, failed, staleRemoved: stale.length };
        console.log('Result:', JSON.stringify(result));
        return { statusCode: 200, headers, body: JSON.stringify(result) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
    }
};
