/**
 * VAPID Key Generator for Web Push Notifications
 *
 * Run: node scripts/generate-vapid-keys.js
 *
 * This generates a VAPID key pair using P-256 ECDH.
 * The output JSON should be stored in AWS Secrets Manager as 'der-vapid-keys'.
 * The publicKey should also be set as NEXT_PUBLIC_VAPID_PUBLIC_KEY in .env.local.
 */

const crypto = require('crypto');

// Generate an ECDH key pair on the P-256 curve
const ecdh = crypto.createECDH('prime256v1');
ecdh.generateKeys();

// Base64url encode the keys
function base64urlEncode(buffer) {
    return buffer.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

const publicKey = base64urlEncode(ecdh.getPublicKey());
const privateKey = base64urlEncode(ecdh.getPrivateKey());

const vapidKeys = {
    publicKey,
    privateKey,
    subject: 'mailto:admin@daawateramzaan.com',
};

console.log('\n🔑 VAPID Keys Generated!\n');
console.log('━'.repeat(60));
console.log('\n1. Store this JSON in AWS Secrets Manager (der-vapid-keys):\n');
console.log(JSON.stringify(vapidKeys, null, 2));
console.log('\n━'.repeat(60));
console.log('\n2. Add this to your .env.local:\n');
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
console.log('\n━'.repeat(60));
console.log('\n3. Run this AWS CLI command to update the secret:\n');
console.log(`aws secretsmanager put-secret-value --secret-id der-vapid-keys --secret-string '${JSON.stringify(vapidKeys)}' --region ap-south-1`);
console.log('');
