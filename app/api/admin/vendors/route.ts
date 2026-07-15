import { NextResponse } from 'next/server';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';

export async function GET(request: Request) {
    try {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
        const authHeader = request.headers.get('Authorization');

        if (authHeader !== `Bearer ${defaultPassword}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let items: any[] = [];
        let lastEvaluatedKey: any = undefined;

        do {
            const command = new ScanCommand({
                TableName: TABLES.VENDORS,
                ExclusiveStartKey: lastEvaluatedKey,
            });

            const response = await docClient.send(command);
            if (response.Items) {
                items = items.concat(response.Items);
            }
            lastEvaluatedKey = response.LastEvaluatedKey;
        } while (lastEvaluatedKey);

        items.sort((a, b) => {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            }
            return 0;
        });

        return NextResponse.json({ items, count: items.length });
    } catch (error: any) {
        console.error('DynamoDB Error:', error);
        return NextResponse.json({ error: 'Failed to fetch vendors', details: error.message }, { status: 500 });
    }
}
