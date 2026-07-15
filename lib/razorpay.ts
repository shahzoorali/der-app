import Razorpay from 'razorpay';
import crypto from 'crypto';

let client: Razorpay | null = null;

function getClient(): Razorpay {
    if (!client) {
        client = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || '',
            key_secret: process.env.RAZORPAY_KEY_SECRET || '',
        });
    }
    return client;
}

export async function createPaymentLink(vendor: { phone: string; businessName: string; email?: string }, amountInRupees: number) {
    const rzp = getClient();
    const link = await rzp.paymentLink.create({
        amount: Math.round(amountInRupees * 100),
        currency: 'INR',
        accept_partial: false,
        description: `Daawat-e-Ramzaan Season 6 — Stall fee for ${vendor.businessName}`,
        customer: {
            name: vendor.businessName,
            contact: vendor.phone,
            email: vendor.email || undefined,
        },
        notify: { sms: true, email: !!vendor.email },
        notes: { phone: vendor.phone },
    } as any);

    return {
        id: link.id,
        shortUrl: (link as any).short_url as string,
    };
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false;
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';
    if (!secret) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    try {
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
        return false;
    }
}
