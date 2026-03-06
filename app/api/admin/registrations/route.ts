import { NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1' // Assuming tables are in main region
});

const docClient = DynamoDBDocumentClient.from(client);

export async function GET(request: Request) {
    try {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
        const authHeader = request.headers.get('Authorization');

        if (authHeader !== `Bearer ${defaultPassword}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let items: any[] = [];
        let lastEvaluatedKey: any = undefined;

        // Loop to fetch all items if data exceeds 1MB scan limit
        do {
            const command = new ScanCommand({
                TableName: 'DerDailyRegistrations',
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const response = await docClient.send(command);
            if (response.Items) {
                items = items.concat(response.Items);
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        // Sort by registeredAt descending
        items.sort((a, b) => {
            if (a.registeredAt && b.registeredAt) {
                return new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime();
            }
            return 0;
        });

        return NextResponse.json({
            items,
            count: items.length
        });
    } catch (error: any) {
        console.error('DynamoDB Error:', error);
        return NextResponse.json({ error: 'Failed to fetch registrations', details: error.message }, { status: 500 });
    }
}
