import { NextResponse } from 'next/server';
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';
import { docClient, TABLES } from '@/lib/dynamo';
import { getVendorPhoneFromRequest } from '@/lib/vendor-session';
import { getDownloadUrl } from '@/lib/s3';

export async function GET(request: Request) {
    const phone = getVendorPhoneFromRequest(request);
    if (!phone) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const result = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
    if (!result.Item) {
        return NextResponse.json({ error: 'No application found' }, { status: 404 });
    }

    const item = result.Item;
    const images = await Promise.all(
        (item.images || []).map(async (img: any) => ({ ...img, url: await getDownloadUrl(img.key) }))
    );

    return NextResponse.json({ ...item, images });
}

export async function POST(request: Request) {
    try {
        const phone = getVendorPhoneFromRequest(request);
        if (!phone) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
        if (existing.Item) {
            return NextResponse.json({ error: 'An application already exists for this number.' }, { status: 400 });
        }

        const body = await request.json();
        const { businessName, contactPerson, email, brandDescription, productCategory, cityPreferences, images } = body;

        if (!businessName || !contactPerson || !productCategory || !Array.isArray(cityPreferences) || cityPreferences.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const now = new Date().toISOString();
        const vendorId = randomUUID();

        const item = {
            phone,
            vendorId,
            businessName,
            contactPerson,
            email: email || null,
            brandDescription: brandDescription || '',
            productCategory,
            cityPreferences,
            images: Array.isArray(images) ? images.map((img: any) => ({ key: img.key, name: img.name, uploadedAt: now })) : [],
            status: 'SUBMITTED',
            statusNote: null,
            statusHistory: [{ status: 'SUBMITTED', note: null, at: now }],
            createdAt: now,
            updatedAt: now,
        };

        await docClient.send(new PutCommand({ TableName: TABLES.VENDORS, Item: item }));

        return NextResponse.json({ success: true, vendorId });
    } catch (error: any) {
        console.error('Error creating vendor application:', error);
        return NextResponse.json({ error: 'Failed to submit application', details: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const phone = getVendorPhoneFromRequest(request);
        if (!phone) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone } }));
        if (!existing.Item) {
            return NextResponse.json({ error: 'No application found' }, { status: 404 });
        }

        if (existing.Item.status !== 'INFO_REQUIRED') {
            return NextResponse.json({ error: 'Application can only be edited when additional information is requested.' }, { status: 400 });
        }

        const body = await request.json();
        const { businessName, contactPerson, email, brandDescription, productCategory, cityPreferences, images } = body;
        const now = new Date().toISOString();

        const history = existing.Item.statusHistory || [];
        history.push({ status: 'SUBMITTED', note: 'Vendor resubmitted application', at: now });

        await docClient.send(new UpdateCommand({
            TableName: TABLES.VENDORS,
            Key: { phone },
            UpdateExpression: 'SET businessName = :bn, contactPerson = :cp, email = :em, brandDescription = :bd, productCategory = :pc, cityPreferences = :cpr, images = :img, #st = :status, statusNote = :note, statusHistory = :hist, updatedAt = :now',
            ExpressionAttributeNames: { '#st': 'status' },
            ExpressionAttributeValues: {
                ':bn': businessName ?? existing.Item.businessName,
                ':cp': contactPerson ?? existing.Item.contactPerson,
                ':em': email ?? existing.Item.email,
                ':bd': brandDescription ?? existing.Item.brandDescription,
                ':pc': productCategory ?? existing.Item.productCategory,
                ':cpr': cityPreferences ?? existing.Item.cityPreferences,
                ':img': Array.isArray(images) ? images.map((img: any) => ({ key: img.key, name: img.name, uploadedAt: now })) : existing.Item.images,
                ':status': 'SUBMITTED',
                ':note': null,
                ':hist': history,
                ':now': now,
            },
        }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating vendor application:', error);
        return NextResponse.json({ error: 'Failed to update application', details: error.message }, { status: 500 });
    }
}
