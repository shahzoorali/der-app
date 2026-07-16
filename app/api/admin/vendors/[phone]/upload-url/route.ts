import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getUploadUrl, ALLOWED_UPLOAD_TYPES } from '@/lib/s3';

// Admin-side presigned upload URL for editing a vendor's documents.
// Auth is enforced centrally by middleware for all /api/admin/* routes.
export async function POST(request: Request, { params }: { params: Promise<{ phone: string }> }) {
    try {
        const { phone } = await params;
        const decodedPhone = decodeURIComponent(phone);

        const { fileName, contentType } = await request.json();

        if (!fileName || !contentType || !ALLOWED_UPLOAD_TYPES.includes(contentType)) {
            return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WEBP, PDF.' }, { status: 400 });
        }

        const safeName = String(fileName).replace(/[^a-zA-Z0-9._-]/g, '_').slice(-100);
        const key = `vendors/${decodedPhone.replace('+', '')}/${randomUUID()}-${safeName}`;

        const uploadUrl = await getUploadUrl(key, contentType);

        return NextResponse.json({ uploadUrl, key });
    } catch (error: any) {
        console.error('Error generating admin upload URL:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL', details: error.message }, { status: 500 });
    }
}
