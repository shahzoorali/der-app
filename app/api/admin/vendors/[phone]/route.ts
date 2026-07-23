import { NextResponse } from 'next/server';
import { GetCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLES } from '@/lib/dynamo';
import { getPublicUrl, deleteObjects } from '@/lib/s3';
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
    // Bucket is public-read — link objects directly instead of signing.
    const images = (item.images || []).map((img: any) => ({ ...img, url: getPublicUrl(img.key) }));

    return NextResponse.json({ ...item, images });
}

// Hard-delete a vendor: removes their uploaded files from S3 and their record
// from DynamoDB. Irreversible. Requires the vendor's exact phone echoed back in
// the body as a safety confirmation.
export async function DELETE(request: Request, { params }: { params: Promise<{ phone: string }> }) {
    if (!checkAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone } = await params;
    const decodedPhone = decodeURIComponent(phone);

    try {
        const body = await request.json().catch(() => ({}));
        if (body.confirmPhone !== decodedPhone) {
            return NextResponse.json({ error: 'Confirmation phone does not match.' }, { status: 400 });
        }

        const existing = await docClient.send(new GetCommand({ TableName: TABLES.VENDORS, Key: { phone: decodedPhone } }));
        if (!existing.Item) {
            return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
        }

        // Delete uploaded files first; if this fails we don't orphan the record.
        const keys = (existing.Item.images || []).map((img: any) => img.key).filter(Boolean);
        await deleteObjects(keys);

        await docClient.send(new DeleteCommand({ TableName: TABLES.VENDORS, Key: { phone: decodedPhone } }));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting vendor:', error);
        return NextResponse.json({ error: 'Failed to delete vendor', details: error.message }, { status: 500 });
    }
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

        if (action === 'editDetails') {
            const { businessName, contactPerson, email, brandDescription, productCategory, cityPreferences } = body;
            if (!businessName || !contactPerson || !productCategory || !Array.isArray(cityPreferences) || cityPreferences.length === 0) {
                return NextResponse.json({ error: 'Business name, contact person, category and at least one city are required' }, { status: 400 });
            }

            const history = existing.Item.statusHistory || [];
            history.push({ status: existing.Item.status, note: 'Details edited by admin', at: now });

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET businessName = :bn, contactPerson = :cp, email = :em, brandDescription = :bd, productCategory = :pc, cityPreferences = :cpr, statusHistory = :hist, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':bn': businessName,
                    ':cp': contactPerson,
                    ':em': email || null,
                    ':bd': brandDescription || '',
                    ':pc': productCategory,
                    ':cpr': cityPreferences,
                    ':hist': history,
                    ':now': now,
                },
            }));

            return NextResponse.json({ success: true });
        }

        if (action === 'editApplication') {
            // Extended application fields (everything beyond the core details).
            const {
                applicationType, city, whatsappNumber, instagram, website,
                categoryOther, productsShowcasing, priceRange, participatedBefore,
                exhibitionNames, stallSize, electricity, lightsCount, additionalRequirements,
            } = body;

            const history = existing.Item.statusHistory || [];
            history.push({ status: existing.Item.status, note: 'Application details edited by admin', at: now });

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET applicationType = :at, city = :city, cityPreferences = :cpr, whatsappNumber = :wa, instagram = :ig, website = :web, categoryOther = :co, productsShowcasing = :ps, priceRange = :pr, participatedBefore = :pb, exhibitionNames = :en, stallSize = :ss, electricity = :el, lightsCount = :lc, additionalRequirements = :ar, statusHistory = :hist, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':at': applicationType === 'FOOD' ? 'FOOD' : 'FASHION',
                    ':city': city || existing.Item.city || null,
                    // Keep cityPreferences aligned with the single city field.
                    ':cpr': city ? [city] : (existing.Item.cityPreferences || []),
                    ':wa': whatsappNumber || null,
                    ':ig': instagram || null,
                    ':web': website || null,
                    ':co': categoryOther || null,
                    ':ps': productsShowcasing || null,
                    ':pr': priceRange || null,
                    ':pb': !!participatedBefore,
                    ':en': exhibitionNames || null,
                    ':ss': stallSize || null,
                    ':el': !!electricity,
                    ':lc': lightsCount ?? null,
                    ':ar': additionalRequirements || null,
                    ':hist': history,
                    ':now': now,
                },
            }));

            return NextResponse.json({ success: true });
        }

        if (action === 'updateImages') {
            const { images } = body;
            if (!Array.isArray(images)) {
                return NextResponse.json({ error: 'Images must be an array' }, { status: 400 });
            }
            const normalized = images.map((img: any) => ({
                key: img.key,
                name: img.name,
                uploadedAt: img.uploadedAt || now,
            }));

            const history = existing.Item.statusHistory || [];
            history.push({ status: existing.Item.status, note: 'Documents edited by admin', at: now });

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET images = :img, statusHistory = :hist, updatedAt = :now',
                ExpressionAttributeValues: { ':img': normalized, ':hist': history, ':now': now },
            }));

            return NextResponse.json({ success: true });
        }

        if (action === 'assignStall') {
            // A vendor may be allotted stalls in multiple cities. `stalls` is the
            // full list; `stall` mirrors the first entry for backward compat with
            // the vendor dashboard / agreement pages that still read a single stall.
            const { stalls } = body;
            if (!Array.isArray(stalls)) {
                return NextResponse.json({ error: 'Stalls must be an array' }, { status: 400 });
            }
            const cleaned = stalls
                .filter((s: any) => s && s.city && s.stallNumber)
                .map((s: any) => ({
                    city: s.city,
                    stallNumber: s.stallNumber,
                    size: s.size || null,
                    notes: s.notes || null,
                    assignedAt: s.assignedAt || now,
                }));

            await docClient.send(new UpdateCommand({
                TableName: TABLES.VENDORS,
                Key: { phone: decodedPhone },
                UpdateExpression: 'SET stalls = :stalls, stall = :stall, updatedAt = :now',
                ExpressionAttributeValues: {
                    ':stalls': cleaned,
                    ':stall': cleaned[0] || null,
                    ':now': now,
                },
            }));

            return NextResponse.json({ success: true, stalls: cleaned });
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
