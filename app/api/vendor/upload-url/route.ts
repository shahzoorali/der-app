import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getVendorPhoneFromRequest } from '@/lib/vendor-session';
import { getUploadUrl, ALLOWED_UPLOAD_TYPES } from '@/lib/s3';

export async function POST(request: Request) {
    try {
        const phone = getVendorPhoneFromRequest(request);
        if (!phone) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { fileName, contentType } = await request.json();

        if (!fileName || !contentType || !ALLOWED_UPLOAD_TYPES.includes(contentType)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, PDF.' }, { status: 400 });
        }

        const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
        const key = `vendors/${phone.replace('+', '')}/${randomUUID()}-${safeName}`;

        const uploadUrl = await getUploadUrl(key, contentType);

        return NextResponse.json({ uploadUrl, key });
    } catch (error: any) {
        console.error('Error generating upload URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL', details: error.message }, { status: 500 });
    }
}
