import { NextResponse } from 'next/server';
import { initWhatsApp, getLatestQr, isWhatsAppConnected } from '@/lib/whatsapp';

export async function GET(request: Request) {
    try {
        const authHeader = request.headers.get('Authorization');
        const password = authHeader?.replace('Bearer ', '');

        if (!password || password !== (process.env.ADMIN_PASSWORD || 'ramzaan2026')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Kick off the connection if it hasn't started yet — this generates
        // a fresh QR code the first time (or after a logout), independent of
        // whether AWS credentials are configured.
        initWhatsApp();

        return NextResponse.json({ qr: getLatestQr(), connected: isWhatsAppConnected() });
    } catch (error: any) {
        console.error('Error fetching WhatsApp QR:', error);
        return NextResponse.json({ error: 'Failed to fetch QR', details: error.message }, { status: 500 });
    }
}
