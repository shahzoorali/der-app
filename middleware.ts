import { NextRequest, NextResponse } from 'next/server';

// Central auth gate for admin APIs. Every /api/admin/* route is protected here as a
// defense-in-depth layer, so a route that forgets its own check is still not exposed.
//
// Note: the /admin/* *pages* are client-rendered and hold the password in React state
// (no cookie), so they self-gate in the browser and are intentionally not matched here —
// gating document requests would block the login screen itself. The pages are harmless
// without the password since every data fetch goes through these protected APIs.

export function middleware(request: NextRequest) {
    const expected = `Bearer ${process.env.ADMIN_PASSWORD || 'ramzaan2026'}`;
    const provided = request.headers.get('Authorization') || '';

    if (provided !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/admin/:path*'],
};
