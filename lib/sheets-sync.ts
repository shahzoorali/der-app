// Optional mirror of vendor submissions into a Google Sheet.
//
// Set VENDOR_SHEET_WEBHOOK_URL to the deployment URL of a Google Apps Script
// web app (see the script below). When the env var is unset, syncing is a
// no-op so submissions never depend on Sheets being reachable.
//
// --- Apps Script to paste into the bound script of your Google Sheet ---
// function doPost(e) {
//   var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Vendors')
//     || SpreadsheetApp.getActiveSpreadsheet().insertSheet('Vendors');
//   var data = JSON.parse(e.postData.contents);
//   if (sheet.getLastRow() === 0) sheet.appendRow(data.headers);
//   sheet.appendRow(data.row);
//   return ContentService.createTextOutput(JSON.stringify({ ok: true }))
//     .setMimeType(ContentService.MimeType.JSON);
// }
// Deploy > New deployment > Web app > Execute as "Me", Access "Anyone".
// Copy the /exec URL into VENDOR_SHEET_WEBHOOK_URL.

type VendorRecord = {
    applicationType?: string;
    businessName?: string;
    contactPerson?: string;
    phone?: string;
    whatsappNumber?: string | null;
    email?: string | null;
    city?: string | null;
    instagram?: string | null;
    website?: string | null;
    productCategory?: string;
    categoryOther?: string | null;
    brandDescription?: string;
    productsShowcasing?: string | null;
    priceRange?: string | null;
    participatedBefore?: boolean;
    exhibitionNames?: string | null;
    stallSize?: string | null;
    electricity?: boolean;
    lightsCount?: string | number | null;
    additionalRequirements?: string | null;
    consent?: boolean;
    images?: { name?: string; docType?: string }[];
    status?: string;
    createdAt?: string;
    [key: string]: unknown;
};

const HEADERS = [
    'Submitted At',
    'Track',
    'Brand Name',
    'Contact Person',
    'Mobile',
    'WhatsApp',
    'Email',
    'City',
    'Instagram',
    'Website',
    'Category',
    'Category (Other)',
    'Brand Description',
    'Products Showcasing',
    'Price Range',
    'Exhibited Before',
    'Exhibition Names',
    'Stall Size',
    'Electricity',
    'Lights',
    'Additional Requirements',
    'Consent',
    'Uploads',
    'Status',
];

function toRow(v: VendorRecord): (string | number)[] {
    const uploads = (v.images || [])
        .map((img) => `${img.docType || 'file'}:${img.name || ''}`)
        .join(', ');
    return [
        v.createdAt || new Date().toISOString(),
        v.applicationType === 'FOOD' ? 'Food Court' : 'Fashion & Lifestyle',
        v.businessName || '',
        v.contactPerson || '',
        v.phone || '',
        v.whatsappNumber || '',
        v.email || '',
        v.city || '',
        v.instagram || '',
        v.website || '',
        v.productCategory || '',
        v.categoryOther || '',
        v.brandDescription || '',
        v.productsShowcasing || '',
        v.priceRange || '',
        v.participatedBefore ? 'Yes' : 'No',
        v.exhibitionNames || '',
        v.stallSize || '',
        v.electricity ? 'Yes' : 'No',
        v.lightsCount ?? '',
        v.additionalRequirements || '',
        v.consent ? 'Yes' : 'No',
        uploads,
        v.status || '',
    ];
}

// Append a vendor submission to the Google Sheet. Never throws — logs and
// resolves so callers can fire-and-forget without risking the request.
export async function syncVendorToSheet(vendor: VendorRecord): Promise<void> {
    const url = process.env.VENDOR_SHEET_WEBHOOK_URL;
    if (!url) return;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ headers: HEADERS, row: toRow(vendor) }),
        });
        if (!res.ok) {
            console.error('Sheet sync failed:', res.status, await res.text().catch(() => ''));
        }
    } catch (error) {
        console.error('Sheet sync error:', error);
    }
}
