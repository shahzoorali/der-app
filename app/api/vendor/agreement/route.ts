import { NextResponse } from 'next/server';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { getVendorPhoneFromRequest } from '@/lib/vendor-session';

export async function POST(request: Request) {
    try {
        const phone = getVendorPhoneFromRequest(request);
        if (!phone) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
        if (!existing.Item) {
            return NextResponse.json({ error: 'No application found' }, { status: 404 });
        }
        if (!existing.Item.stall) {
            return NextResponse.json({ error: 'Stall has not been assigned yet.' }, { status: 400 });
        }
        if (existing.Item.agreement?.accepted) {
            return NextResponse.json({ error: 'Agreement already accepted.' }, { status: 400 });
        }

        const { name, details } = await request.json();
        if (!name) {
            return NextResponse.json({ error: 'Name is required to accept the agreement.' }, { status: 400 });
        }

        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
        const now = new Date().toISOString();

        const agreement = {
            accepted: true,
            name,
            details: details || {},
            acceptedAt: now,
            ip,
        };

        await docClient.send(new UpdateCommand({
            TableName: TABLES.VENDORS,
            Key: { phone },
            UpdateExpression: 'SET agreement = :agreement, updatedAt = :now',
            ExpressionAttributeValues: { ':agreement': agreement, ':now': now },
        }));

        return NextResponse.json({ success: true, agreement });
    } catch (error: any) {
        console.error('Error accepting agreement:', error);
        return NextResponse.json({ error: 'Failed to record agreement', details: error.message }, { status: 500 });
    }
}
