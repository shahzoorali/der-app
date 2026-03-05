import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

const ddb = new DynamoDBClient({});
const TABLE_NAME = process.env.TABLE_NAME!;

interface RegisterEvent {
    body?: string;
    requestContext?: any;
}

interface SubscriptionPayload {
    subscription: {
        endpoint: string;
        keys: {
            p256dh: string;
            auth: string;
        };
    };
    platform: 'web' | 'ios' | 'android';
    tags?: string[];
}

export const handler = async (event: RegisterEvent) => {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST,OPTIONS',
    };

    try {
        if (event.requestContext?.http?.method === 'OPTIONS') {
            return { statusCode: 200, headers, body: '' };
        }

        const body: SubscriptionPayload = JSON.parse(event.body || '{}');

        if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth || !body.platform) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Missing required fields: subscription (endpoint, keys.p256dh, keys.auth), platform' }),
            };
        }

        const now = new Date().toISOString();

        await ddb.send(new PutItemCommand({
            TableName: TABLE_NAME,
            Item: {
                endpoint: { S: body.subscription.endpoint },
                p256dh: { S: body.subscription.keys.p256dh },
                auth: { S: body.subscription.keys.auth },
                platform: { S: body.platform },
                tags: body.tags && body.tags.length > 0 ? { SS: body.tags } : { NULL: true },
                createdAt: { S: now },
                updatedAt: { S: now },
            },
        }));

        console.log(`Subscription registered: ${body.platform} - ${body.subscription.endpoint.substring(0, 40)}...`);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Subscription registered successfully' }),
        };
    } catch (error) {
        console.error('Error registering subscription:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Internal server error' }),
        };
    }
};
