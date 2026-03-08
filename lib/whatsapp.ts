import { makeWASocket, useMultiFileAuthState, DisconnectReason, ConnectionState, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import path from 'path';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

// Using a custom logger to reduce noise, unless debugging
const logger = pino({ level: 'silent' }) as any;

let sock: ReturnType<typeof makeWASocket> | null = null;
let isConnecting = false;
let isConnected = false;

// We'll queue requests to avoid hitting rate limits too hard
const checkQueue: { phone: string; resolve: (val: boolean) => void; reject: (err: any) => void }[] = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue || checkQueue.length === 0 || !sock || !isConnected) return;

    isProcessingQueue = true;
    while (checkQueue.length > 0) {
        const item = checkQueue.shift();
        if (!item) continue;

        try {
            // Need to format phone number as JID
            const jid = `${item.phone}@s.whatsapp.net`;
            const results = await sock.onWhatsApp(jid);

            if (results && results.length > 0 && results[0].exists) {
                item.resolve(true);
            } else {
                item.resolve(false);
            }
        } catch (err) {
            console.error('Error checking WhatsApp presence:', err);
            item.resolve(false); // Default to false on error to fallback to SMS
        }

        // Rate limit: 4 checks per second max (250ms)
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    isProcessingQueue = false;
}

export async function initWhatsApp() {
    if (sock || isConnecting) return;
    isConnecting = true;

    try {
        const authFolder = path.join(process.cwd(), 'wa-auth');
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: state,
            // You can configure browser name if desired
            browser: ['Daawat-e-Ramzaan', 'Chrome', '1.0.0'],
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log('--- SCAN QR CODE BELOW ---');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                isConnected = false;
                const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('WhatsApp connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);

                sock = null;
                isConnecting = false;

                if (shouldReconnect) {
                    initWhatsApp();
                } else {
                    console.log('WhatsApp logged out. Please delete the wa-auth folder and restart to scan QR code again.');
                }
            } else if (connection === 'open') {
                console.log('WhatsApp connected successfully!');
                isConnecting = false;
                isConnected = true;
                processQueue(); // Start processing any pending checks
            }
        });
    } catch (error) {
        console.error('Failed to initialize WhatsApp:', error);
        sock = null;
        isConnecting = false;
    }
}

export async function checkWhatsAppPresence(phoneStr: string): Promise<boolean> {
    // Ensure initialized
    if (!sock) {
        await initWhatsApp();
    }

    // Normalize phone (strip any '+' or spaces)
    const cleanPhone = phoneStr.replace(/\D/g, '');

    return new Promise((resolve, reject) => {
        checkQueue.push({ phone: cleanPhone, resolve, reject });
        if (sock && isConnected) {
            processQueue();
        }
    });
}

export function isWhatsAppConnected(): boolean {
    return isConnected;
}
