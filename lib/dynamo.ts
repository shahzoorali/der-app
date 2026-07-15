import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { devDocClient } from '@/lib/dev-store';

export const hasAwsCredentials = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

const credentials = hasAwsCredentials ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
} : undefined;

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials
});

// In local development without AWS credentials, fall back to a file-backed
// stand-in so the OTP/vendor/admin flows can be exercised end-to-end without
// touching real AWS. Production always uses real DynamoDB.
export const docClient = hasAwsCredentials
    ? DynamoDBDocumentClient.from(ddbClient)
    : (devDocClient as unknown as DynamoDBDocumentClient);

export const TABLES = {
    OTPS: 'DerOTPs',
    DAILY_REGISTRATIONS: 'DerDailyRegistrations',
    REGISTRATIONS: 'DerRegistrations',
    PUSH_SUBSCRIPTIONS: 'DerPushSubscriptions',
    VENDORS: 'DerVendors',
} as const;
