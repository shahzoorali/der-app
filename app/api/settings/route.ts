import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'settings.json');

// Helper to ensure file exists
async function ensureSettingsFile() {
    try {
        await fs.access(dataFilePath);
    } catch {
        await fs.writeFile(dataFilePath, JSON.stringify({ droneShowHighlightsUrl: '' }, null, 2));
    }
}

export async function GET() {
    try {
        await ensureSettingsFile();
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const settings = JSON.parse(fileContents);
        return NextResponse.json(settings);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to read settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'ramzaan2026';
        const authHeader = request.headers.get('Authorization');
        if (authHeader !== `Bearer ${defaultPassword}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        await ensureSettingsFile();
        const fileContents = await fs.readFile(dataFilePath, 'utf8');
        const settings = JSON.parse(fileContents);

        // Update settings
        const newSettings = { ...settings, ...body };

        await fs.writeFile(dataFilePath, JSON.stringify(newSettings, null, 2));

        return NextResponse.json(newSettings, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
