import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    // If running locally, it will use environment credentials or shared credentials file.
    // Ensure the machine running this has permissions to scan DerPushSubscriptions.
    region: process.env.AWS_REGION || 'ap-south-1' // Adjust region if necessary
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: Request) {
    try {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
        const authHeader = request.headers.get('Authorization');

        if (authHeader !== `Bearer ${defaultPassword}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const command = new ScanCommand({
            TableName: 'DerPushSubscriptions',
        });

        const response = await docClient.send(command);

        // Sort by createdAt descending if it exists, otherwise leave as is
        const items = response.Items || [];
        items.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return 0;
        });

        return NextResponse.json({
            items,
            count: response.Count || 0,
            scannedCount: response.ScannedCount || 0
        });
    } catch (error: any) {
        console.error('DynamoDB Error:', error);
        return NextResponse.json({ error: 'Failed to fetch subscribers', details: error.message }, { status: 500 });
    }
}
