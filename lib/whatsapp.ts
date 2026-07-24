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
let latestQr: string | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

// Delay before attempting to reconnect after a drop. A short backoff lets the
// previous socket fully close on WhatsApp's side before we open a new one —
// reconnecting instantly (especially after a "conflict") just triggers another
// conflict and spins a tight loop.
const RECONNECT_DELAY_MS = 3000;

function scheduleReconnect() {
    // Only ever have one reconnect pending, and never while already
    // connecting/connected — this is what prevents overlapping sockets.
    if (reconnectTimer || isConnecting || isConnected) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        initWhatsApp();
    }, RECONNECT_DELAY_MS);
}

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
    // Guard: never open a second socket while one is live or being opened, and
    // cancel any pending reconnect since we're connecting right now.
    if (sock || isConnecting || isConnected) return;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    isConnecting = true;

    try {
        const authFolder = path.join(process.cwd(), 'wa-auth');
        const { state, saveCreds } = await useMultiFileAuthState(authFolder);
        const { version } = await fetchLatestBaileysVersion();

        const thisSock = makeWASocket({
            version,
            logger,
            printQRInTerminal: true,
            auth: state,
            // You can configure browser name if desired
            browser: ['Daawat-e-Ramzaan', 'Chrome', '1.0.0'],
        });
        sock = thisSock;

        thisSock.ev.on('creds.update', saveCreds);

        thisSock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            // Ignore late events from a socket we've already replaced.
            if (sock !== thisSock && connection !== 'close') return;

            if (qr) {
                latestQr = qr;
                console.log('--- SCAN QR CODE BELOW ---');
                qrcode.generate(qr, { small: true });
            }

            if (connection === 'close') {
                const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
                const loggedOut = statusCode === DisconnectReason.loggedOut;

                // Only react to a close for the socket we currently hold, so a
                // stale socket's close can't clobber a newer connection.
                if (sock === thisSock) {
                    isConnected = false;
                    sock = null;
                    isConnecting = false;

                    if (loggedOut) {
                        console.log('WhatsApp logged out. Please delete the wa-auth folder and restart to scan QR code again.');
                    } else {
                        console.log('WhatsApp connection closed, scheduling reconnect. Reason:', lastDisconnect?.error?.message);
                        scheduleReconnect();
                    }
                }
            } else if (connection === 'open') {
                console.log('WhatsApp connected successfully!');
                isConnecting = false;
                isConnected = true;
                latestQr = null;
                processQueue(); // Start processing any pending checks
            }
        });

        // Diagnostic: log delivery-status transitions for outgoing messages so
        // we can tell whether WhatsApp actually delivered an OTP or silently
        // dropped it after sendMessage() resolved.
        thisSock.ev.on('messages.update', (updates) => {
            for (const u of updates) {
                const status = u.update?.status;
                if (status !== undefined) {
                    console.log(`[WA receipt] to=${u.key.remoteJid} id=${u.key.id} status=${status}`);
                }
            }
        });

        thisSock.ev.on('messages.media-update', () => { /* noop */ });
    } catch (error) {
        console.error('Failed to initialize WhatsApp:', error);
        sock = null;
        isConnecting = false;
        scheduleReconnect();
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

export function getLatestQr(): string | null {
    return latestQr;
}

export async function sendWhatsAppMessage(phoneStr: string, text: string): Promise<boolean> {
    if (!sock) {
        await initWhatsApp();
    }

    // Wait briefly for the connection to come up if we just triggered init
    const deadline = Date.now() + 10_000;
    while (!isConnected && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 250));
    }

    if (!sock || !isConnected) {
        console.error('Cannot send WhatsApp message: not connected');
        return false;
    }

    const cleanPhone = phoneStr.replace(/\D/g, '');

    try {
        // Resolve the canonical JID via onWhatsApp rather than assuming
        // @s.whatsapp.net — WhatsApp may return a different addressing (e.g.
        // @lid) for some accounts, and sending to the wrong JID silently fails.
        let jid = `${cleanPhone}@s.whatsapp.net`;
        try {
            const results = await sock.onWhatsApp(jid);
            if (results && results.length > 0 && results[0].exists && results[0].jid) {
                jid = results[0].jid;
            } else if (results && results.length > 0 && !results[0].exists) {
                console.error(`[WA send] ${cleanPhone} is NOT on WhatsApp — aborting send`);
                return false;
            }
        } catch (e) {
            console.error('[WA send] onWhatsApp lookup failed, using default jid:', e);
        }

        const sent = await sock.sendMessage(jid, { text });
        console.log(`[WA send] queued to ${jid} — messageId=${sent?.key?.id ?? 'none'}`);
        return true;
    } catch (err) {
        console.error('Error sending WhatsApp message:', err);
        return false;
    }
}
