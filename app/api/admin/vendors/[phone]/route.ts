import { NextResponse } from 'next/server';
import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { getDownloadUrl } from '@/lib/s3';
import { createPaymentLink } from '@/lib/razorpay';

const STATUSES = ['SUBMITTED', 'APPROVED', 'WAITLISTED', 'REJECTED', 'INFO_REQUIRED', 'PAID'];

function checkAuth(request: Request): boolean {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
    return request.headers.get('Authorization') === `Bearer ${defaultPassword}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ phone: string }> }) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await params;
    const decodedPhone = decodeURIComponent(phone);

    const result = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone: decodedPhone } }));
    if (!result.Item) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
    }

    const item = result.Item;
    const images = await Promise.all(
        (item.images || []).map(async (img: any) => ({ ...img, url: await getDownloadUrl(img.key) }))
    );

    return NextResponse.json({ ...item, images });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ phone: string }> }) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await params;
    const decodedPhone = decodeURIComponent(phone);

    try {
        const body = await request.json();
        const { action } = body;
        const now = new Date().toISOString();

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone: decodedPhone } }));
        if (!existing.Item) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        if (action === 'setStatus') {
            const { status, note } = body;
            if (!STATUSES.includes(status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }
            const history = existing.Item.statusHistory || [];
            history.push({ status, note: note || null, at: now });

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET #st = :status, statusNote = :note, statusHistory = :hist, updatedAt = :now',
                ExpressionAttributeNames: { '#st': 'status' },
                ExpressionAttributeValues: { ':status': status, ':note': note || null, ':hist': history, ':now': now },
            }));

            return NextResponse.json({ success: true });
        }

        if (action === 'assignStall') {
            const { city, stallNumber, size, notes } = body;
            if (!city || !stallNumber) {
                return NextResponse.json({ error: 'City and stall number are required' }, { status: 400 });
            }
            const stall = { city, stallNumber, size: size || null, notes: notes || null, assignedAt: now };

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET stall = :stall, updatedAt = :now',
                ExpressionAttributeValues: { ':stall': stall, ':now': now },
            }));

            return NextResponse.json({ success: true, stall });
        }

        if (action === 'createPaymentLink') {
            const { amount } = body;
            if (!amount || typeof amount !== 'number' || amount <= 0) {
                return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
            }

            const link = await createPaymentLink(
                { phone: decodedPhone, businessName: existing.Item.businessName, email: existing.Item.email },
                amount
            );

            const payment = {
                amount,
                razorpayLinkId: link.id,
                shortUrl: link.shortUrl,
                status: 'created',
            };

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET payment = :payment, updatedAt = :now',
                ExpressionAttributeValues: { ':payment': payment, ':now': now },
            }));

            return NextResponse.json({ success: true, payment });
        }

        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    } catch (error: any) {
        console.error('Error updating vendor:', error);
        return NextResponse.json({ error: 'Failed to update vendor', details: error.message }, { status: 500 });
    }
}
