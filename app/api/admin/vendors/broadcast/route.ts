import { NextResponse } from 'next/server';
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { sendWhatsAppMessage, isWhatsAppConnected } from '@/lib/whatsapp';

function checkAuth(request: Request): boolean {
    const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
    return request.headers.get('Authorization') === `Bearer ${defaultPassword}`;
}

async function getAllVendors() {
    let items: any[] = [];
    let lastEvaluatedKey: any = undefined;
    do {
        const response = await docClient.send(new ScanCommand({
            TableName: TABLES.VENDORS,
            ExclusiveStartKey: lastEvaluatedKey,
        }));
        if (response.Items) items = items.concat(response.Items);
        lastEvaluatedKey = response.LastEvaluatedKey;
    } while (lastEvaluatedKey);
    return items;
}

// Send a WhatsApp announcement to a chosen set of vendors.
// target: 'all' | 'status' | 'selected'
export async function POST(request: Request) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!isWhatsAppConnected()) {
        return NextResponse.json({ error: 'WhatsApp is not connected. Scan the QR code at /admin/whatsapp-qr first.' }, { status: 400 });
    }

    const body = await request.json();
    const { message, target, status, phones } = body;

    if (!message || typeof message !== 'string' || !message.trim()) {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const vendors = await getAllVendors();

    let targetPhones: string[] = [];
    if (target === 'selected') {
        if (!Array.isArray(phones) || phones.length === 0) {
            return NextResponse.json({ error: 'No vendors selected' }, { status: 400 });
        }
        targetPhones = phones;
    } else if (target === 'status') {
        if (!status) {
            return NextResponse.json({ error: 'Status is required for status-based targeting' }, { status: 400 });
        }
        targetPhones = vendors.filter((v) => v.status === status).map((v) => v.phone);
    } else {
        targetPhones = vendors.map((v) => v.phone);
    }

    let sent = 0;
    let failed = 0;
    const failedPhones: string[] = [];

    // Send sequentially with a small delay — WhatsApp rate-limits bulk sends
    // and Baileys shares one socket for the whole app.
    for (const phone of targetPhones) {
        try {
            const ok = await sendWhatsAppMessage(phone, message);
            if (ok) {
                sent++;
            } else {
                failed++;
                failedPhones.push(phone);
            }
        } catch {
            failed++;
            failedPhones.push(phone);
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return NextResponse.json({ success: true, total: targetPhones.length, sent, failed, failedPhones });
}
