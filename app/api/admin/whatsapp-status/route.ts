import { NextResponse } from 'next/server';
import { isWhatsAppConnected } from '@/lib/whatsapp';

export async function GET(request: Request) {
    try {
        // Basic auth check using password header
        const authHeader = request.headers.get('Authorization');
        const password = authHeader?.replace('Bearer ', '');

        if (!password || password !== (process.env.ADMIN_PASSWORD || 'ramzaan2026')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connected = isWhatsAppConnected();
        return NextResponse.json({ connected });
    } catch (error: any) {
        console.error('Error fetching WhatsApp status:', error);
        return NextResponse.json({ error: 'Failed to fetch status', details: error.message }, { status: 500 });
    }
}
