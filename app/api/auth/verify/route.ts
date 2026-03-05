import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { password } = await request.json();
        const correctPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';

        if (password === correctPassword) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
