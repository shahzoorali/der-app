import { DynamoDBClient, ScanCommand, DeleteItemCommand } from '@aws-sdk/client-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import webpush from 'web-push';

const ddb = new DynamoDBClient({});
const sm = new SecretsManagerClient({});

const TABLE_NAME = process.env.TABLE_NAME!;
const VAPID_SECRET_ARN = process.env.VAPID_SECRET_ARN!;

// Timetable data embedded at deploy time
const TIMETABLE: Array<{ day: number; fullDate: string; suhoor: string; iftar: string }> =
    JSON.parse(process.env.TIMETABLE_JSON || '[]');

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

let cachedVapidKeys: VapidKeys | null = null;

async function getVapidKeys(): Promise<VapidKeys> {
    if (cachedVapidKeys) return cachedVapidKeys;
    const result = await sm.send(new GetSecretValueCommand({ SecretId: VAPID_SECRET_ARN }));
    cachedVapidKeys = JSON.parse(result.SecretString!);
    return cachedVapidKeys!;
}

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

function getSuhoorNotification(day?: number): NotificationPayload {
    const entry = day ? TIMETABLE.find(t => t.day === day) : TIMETABLE.find(t => t.fullDate === new Date().toISOString().split('T')[0]);
    if (entry) {
        return {
            title: '🌙 Suhoor Ends Now',
            body: `It's ${formatTime(entry.suhoor)}. Day ${entry.day} Suhoor time is over. Please conclude your meal.`,
        };
    }
    return { title: '🌙 Suhoor Ends Now', body: 'It is time to conclude your Suhoor meal.' };
}

function getIftarNotification(day?: number): NotificationPayload {
    const entry = day ? TIMETABLE.find(t => t.day === day) : TIMETABLE.find(t => t.fullDate === new Date().toISOString().split('T')[0]);
    if (entry) {
        return {
            title: '🌅 Iftar Time!',
            body: `It's ${formatTime(entry.iftar)}. Day ${entry.day} Iftar time has begun. Wishing you a blessed Iftar!`,
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

export const handler = async (event: any) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,x-api-key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };

    try {
        let notification: NotificationPayload;

        if (event.requestContext?.http?.method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        if (event.body) {
            // Admin API call via API Gateway
            // Validate Authorization header
            const adminApiKey = process.env.ADMIN_API_KEY;
            const authHeader = event.headers?.['authorization'] || event.headers?.['Authorization'];

            if (adminApiKey && authHeader !== `Bearer ${adminApiKey}`) {
                console.warn('Unauthorized admin notification attempt');
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
            }

            const body = JSON.parse(event.body);
            if (!body.title || !body.body) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing title or body' }) };
            }
            notification = { title: body.title, body: body.body };
            console.log(`Admin notification: ${notification.title}`);
        } else {
            const detail = event.detail || event;
            if (detail.type === 'suhoor') {
                notification = getSuhoorNotification(detail.day);
            } else if (detail.type === 'iftar') {
                notification = getIftarNotification(detail.day);
            } else if (detail.title && detail.body) {
                notification = { title: detail.title, body: detail.body };
            } else {
                console.error('Cannot determine notification from event:', JSON.stringify(event));
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid event' }) };
            }
        }

        const subscriptions = await getAllSubscriptions();
        console.log(`Sending to ${subscriptions.length} subscriptions`);

        if (subscriptions.length === 0) {
            return { statusCode: 200, headers, body: JSON.stringify({ success: true, sent: 0, message: 'No subscriptions' }) };
        }

        const vapidKeys = await getVapidKeys();

        // Setup web-push configured with our keys
        webpush.setVapidDetails(
            vapidKeys.subject,
            vapidKeys.publicKey,
            vapidKeys.privateKey
        );

        let sent = 0;
        let failed = 0;
        const stale: string[] = [];

        const batchSize = 10;
        for (let i = 0; i < subscriptions.length; i += batchSize) {
            const batch = subscriptions.slice(i, i + batchSize);
            await Promise.allSettled(
                batch.map(async (sub) => {
                    try {
                        const pushSubscription = {
                            endpoint: sub.endpoint,
                            keys: {
                                p256dh: sub.p256dh,
                                auth: sub.auth
                            }
                        };
                        console.log(`Sending web push to ${sub.endpoint.substring(0, 40)}...`);
                        await webpush.sendNotification(pushSubscription, JSON.stringify(notification));
                        sent++;
                    } catch (e: any) {
                        console.error(`Failed to send to ${sub.endpoint}:`, e);
                        if (e.statusCode === 404 || e.statusCode === 410) {
                            stale.push(sub.endpoint);
                        } else {
                            failed++;
                        }
                    }
                })
            );
        }

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
