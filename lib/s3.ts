import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const credentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
} : undefined;

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials
});

export const VENDOR_UPLOADS_BUCKET = process.env.VENDOR_UPLOADS_BUCKET || 'der-vendor-uploads';

export const ALLOWED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

export async function getUploadUrl(key: string, contentType: string): Promise<string> {
    const command = new PutObjectCommand({
        Bucket: VENDOR_UPLOADS_BUCKET,
        Key: key,
        ContentType: contentType,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 300 });
}

export async function getDownloadUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: VENDOR_UPLOADS_BUCKET,
        Key: key,
    });
    return getSignedUrl(s3Client, command, { expiresIn: 900 });
}

// The vendor uploads bucket is public-read, so objects can be linked directly
// without signing. Each path segment is encoded but "/" separators are kept.
export function getPublicUrl(key: string): string {
    const region = process.env.AWS_REGION || 'ap-south-1';
    const encodedKey = String(key).split('/').map(encodeURIComponent).join('/');
    return `https://${VENDOR_UPLOADS_BUCKET}.s3.${region}.amazonaws.com/${encodedKey}`;
}
