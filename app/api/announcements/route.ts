import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'announcements.json');

export async function GET() {
    try {
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const announcements = JSON.parse(fileContents);
        // Sort by createdAt descending
        announcements.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return NextResponse.json(announcements);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read announcements' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${defaultPassword}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { type, title, time, venue, description, priority } = await request.json();

        if (!type || !title || !time || !venue || !description || !priority) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const announcements = JSON.parse(fileContents);

        const newAnnouncement = {
            id: Date.now().toString(),
            type,
            title,
            time,
            venue,
            description,
            priority,
            createdAt: new Date().toISOString()
        };

        announcements.push(newAnnouncement);

        await fs.writeFile(dataFilePath, JSON.stringify(announcements, null, 2));

        return NextResponse.json(newAnnouncement, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add announcement' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${defaultPassword}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }

        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        let announcements = JSON.parse(fileContents);

        announcements = announcements.filter((a: any) => a.id !== id);

        await fs.writeFile(dataFilePath, JSON.stringify(announcements, null, 2));

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 });
    }
}
