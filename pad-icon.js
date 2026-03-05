const sharp = require('sharp');
const fs = require('fs');

async function processIcons() {
    const input = 'public/der-small.png';
    const metadata = await sharp(input).metadata();

    // We want approximately 50px margins around the image for a 512x512 image.
    // This means the image itself should fit in 412x412.
    const targetInnerSize = 412;
    const targetOuterSize = 512;

    // Generate der-pwa-icon.png (transparent background for 'any' purpose)
    await sharp(input)
        .resize(targetInnerSize, targetInnerSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .toFile('public/der-pwa-icon.png');

    // Generate der-pwa-maskable.png (solid background #fdfaf5 for maskable and Apple)
    await sharp(input)
        .resize(targetInnerSize, targetInnerSize, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
            background: '#fdfaf5'
        })
        // Flatten composite with the background color to be 100% sure it's solid for iOS
        .flatten({ background: '#fdfaf5' })
        .toFile('public/der-pwa-maskable.png');

    console.log('Icons generated successfully.');
}

processIcons().catch(console.error);
