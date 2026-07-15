import { NextResponse } from 'next/server';
import { ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(request: Request) {
    try {
        const rawBody = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!verifyWebhookSignature(rawBody, signature)) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
        }

        const payload = JSON.parse(rawBody);

        if (payload.event !== 'payment_link.paid') {
            return NextResponse.json({ success: true, ignored: true });
        }

        const paymentLinkEntity = payload.payload?.payment_link?.entity;
        const paymentEntity = payload.payload?.payment?.entity;
        const phone = paymentLinkEntity?.notes?.phone;

        if (!phone) {
            return NextResponse.json({ error: 'No phone found in webhook notes' }, { status: 400 });
        }

        // Find vendor by phone (PK), scan fallback if phone format mismatch isn't expected since phone is the key
        const scanResult = await docClient.send(new ScanCommand({
            TableName: TABLES.VENDORS,
            FilterExpression: 'phone = :phone',
            ExpressionAttributeValues: { ':phone': phone },
        }));

        if (!scanResult.Items || scanResult.Items.length === 0) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        const now = new Date().toISOString();

        await docClient.send(new UpdateCommand({
            TableName: TABLES.VENDORS,
            Key: { phone },
            UpdateExpression: 'SET payment.#st = :status, payment.paidAt = :paidAt, payment.razorpayPaymentId = :paymentId, #st = :vendorStatus, updatedAt = :now',
            ExpressionAttributeNames: { '#st': 'status' },
            ConditionExpression: 'attribute_exists(payment)',
            ExpressionAttributeValues: {
                ':status': 'paid',
                ':paidAt': now,
                ':paymentId': paymentEntity?.id || null,
                ':vendorStatus': 'PAID',
                ':now': now,
            },
        }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error processing Razorpay webhook:', error);
        return NextResponse.json({ error: 'Webhook processing failed', details: error.message }, { status: 500 });
    }
}
