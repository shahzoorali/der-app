import { promises as fs } from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'settings.json');

export type AppSettings = {
    droneShowHighlightsUrl?: string;
    aasmaanHighlightsUrl?: string;
    // When true, vendor register/login skip OTP verification entirely. Intended
    // as a temporary switch for when WhatsApp/SMS OTP delivery is unavailable.
    otpBypass?: boolean;
};

export async function getSettings(): Promise<AppSettings> {
    try {
        const contents = await fs.readFile(dataFilePath, 'utf8');
        return JSON.parse(contents);
    } catch {
        return {};
    }
}
