/**
 * Generate all app icons for UOH Meetings platform.
 * Brand: teal green #1e5f4c, accent orange #f97316
 * Design: Stylized "M" inside a rounded square with meeting/people motif
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Brand colors
const BRAND = '#1e5f4c';
const BRAND_LIGHT = '#2f8f71';
const BRAND_LIGHTER = '#d9eee6';
const ACCENT = '#f97316';
const WHITE = '#ffffff';
const BG_LIGHT = '#E6F4FE';

// ------- SVG Icon Designs -------

/** Main app icon: Teal rounded-square with stylized calendar/meeting icon */
function mainIconSvg(size) {
  const s = size;
  const pad = s * 0.12;
  const inner = s - pad * 2;
  const r = s * 0.22; // corner radius

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2f8f71"/>
      <stop offset="100%" stop-color="#1a4f3f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>

  <!-- Background rounded square -->
  <rect x="${pad}" y="${pad}" width="${inner}" height="${inner}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Calendar top bar -->
  <rect x="${s*0.22}" y="${s*0.22}" width="${s*0.56}" height="${s*0.12}" rx="${s*0.03}" fill="${WHITE}" opacity="0.95"/>

  <!-- Calendar hooks -->
  <rect x="${s*0.32}" y="${s*0.18}" width="${s*0.04}" height="${s*0.1}" rx="${s*0.02}" fill="${WHITE}"/>
  <rect x="${s*0.64}" y="${s*0.18}" width="${s*0.04}" height="${s*0.1}" rx="${s*0.02}" fill="${WHITE}"/>

  <!-- Calendar body -->
  <rect x="${s*0.22}" y="${s*0.34}" width="${s*0.56}" height="${s*0.42}" rx="${s*0.03}" fill="${WHITE}" opacity="0.9"/>

  <!-- People icons (3 circles for meeting participants) -->
  <!-- Left person -->
  <circle cx="${s*0.37}" cy="${s*0.48}" r="${s*0.055}" fill="${BRAND}"/>
  <circle cx="${s*0.37}" cy="${s*0.42}" r="${s*0.035}" fill="${BRAND}"/>

  <!-- Center person (highlighted - meeting leader) -->
  <circle cx="${s*0.50}" cy="${s*0.46}" r="${s*0.065}" fill="url(#accent)"/>
  <circle cx="${s*0.50}" cy="${s*0.39}" r="${s*0.04}" fill="url(#accent)"/>

  <!-- Right person -->
  <circle cx="${s*0.63}" cy="${s*0.48}" r="${s*0.055}" fill="${BRAND}"/>
  <circle cx="${s*0.63}" cy="${s*0.42}" r="${s*0.035}" fill="${BRAND}"/>

  <!-- Check mark (meeting confirmed) -->
  <path d="${s*0.40} ${s*0.62} L${s*0.47} ${s*0.69} L${s*0.62} ${s*0.57}"
        fill="none" stroke="${BRAND}" stroke-width="${s*0.03}" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- UOH text at bottom -->
  <text x="${s*0.5}" y="${s*0.84}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="${s*0.08}" fill="${WHITE}" letter-spacing="${s*0.01}">UOH</text>
</svg>`;
}

/** Android adaptive icon foreground (centered icon on transparent bg, 108dp safe zone) */
function androidForegroundSvg(size) {
  const s = size;
  // Adaptive icons use 108dp with 72dp safe zone centered
  // Safe zone starts at 18dp from each edge (18/108 = 16.67%)
  const safeStart = s * 0.167;
  const safeSize = s * 0.667;
  const cx = s / 2;
  const cy = s / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>

  <!-- Calendar top bar -->
  <rect x="${s*0.27}" y="${s*0.25}" width="${s*0.46}" height="${s*0.10}" rx="${s*0.025}" fill="${WHITE}" opacity="0.95"/>

  <!-- Calendar hooks -->
  <rect x="${s*0.35}" y="${s*0.22}" width="${s*0.035}" height="${s*0.08}" rx="${s*0.015}" fill="${WHITE}"/>
  <rect x="${s*0.615}" y="${s*0.22}" width="${s*0.035}" height="${s*0.08}" rx="${s*0.015}" fill="${WHITE}"/>

  <!-- Calendar body -->
  <rect x="${s*0.27}" y="${s*0.35}" width="${s*0.46}" height="${s*0.34}" rx="${s*0.025}" fill="${WHITE}" opacity="0.9"/>

  <!-- People icons -->
  <circle cx="${s*0.39}" cy="${s*0.47}" r="${s*0.045}" fill="${BRAND}"/>
  <circle cx="${s*0.39}" cy="${s*0.42}" r="${s*0.03}" fill="${BRAND}"/>

  <circle cx="${s*0.50}" cy="${s*0.45}" r="${s*0.055}" fill="url(#accent)"/>
  <circle cx="${s*0.50}" cy="${s*0.39}" r="${s*0.035}" fill="url(#accent)"/>

  <circle cx="${s*0.61}" cy="${s*0.47}" r="${s*0.045}" fill="${BRAND}"/>
  <circle cx="${s*0.61}" cy="${s*0.42}" r="${s*0.03}" fill="${BRAND}"/>

  <!-- Check mark -->
  <path d="M${s*0.42} ${s*0.59} L${s*0.48} ${s*0.65} L${s*0.60} ${s*0.55}"
        fill="none" stroke="${BRAND}" stroke-width="${s*0.025}" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- UOH text -->
  <text x="${s*0.5}" y="${s*0.77}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="${s*0.065}" fill="${BRAND}" letter-spacing="${s*0.008}">UOH</text>
</svg>`;
}

/** Android adaptive icon background */
function androidBackgroundSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2f8f71"/>
      <stop offset="100%" stop-color="#1a4f3f"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#bg)"/>
</svg>`;
}

/** Monochrome icon for Android (simple silhouette) */
function monochromeSvg(size) {
  const s = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Calendar outline -->
  <rect x="${s*0.27}" y="${s*0.25}" width="${s*0.46}" height="${s*0.10}" rx="${s*0.025}" fill="#000" opacity="0.8"/>
  <rect x="${s*0.35}" y="${s*0.22}" width="${s*0.035}" height="${s*0.08}" rx="${s*0.015}" fill="#000"/>
  <rect x="${s*0.615}" y="${s*0.22}" width="${s*0.035}" height="${s*0.08}" rx="${s*0.015}" fill="#000"/>
  <rect x="${s*0.27}" y="${s*0.35}" width="${s*0.46}" height="${s*0.34}" rx="${s*0.025}" fill="#000" opacity="0.6"/>

  <!-- People silhouettes -->
  <circle cx="${s*0.39}" cy="${s*0.47}" r="${s*0.045}" fill="#000"/>
  <circle cx="${s*0.39}" cy="${s*0.42}" r="${s*0.03}" fill="#000"/>
  <circle cx="${s*0.50}" cy="${s*0.45}" r="${s*0.055}" fill="#000"/>
  <circle cx="${s*0.50}" cy="${s*0.39}" r="${s*0.035}" fill="#000"/>
  <circle cx="${s*0.61}" cy="${s*0.47}" r="${s*0.045}" fill="#000"/>
  <circle cx="${s*0.61}" cy="${s*0.42}" r="${s*0.03}" fill="#000"/>

  <!-- Check mark -->
  <path d="M${s*0.42} ${s*0.59} L${s*0.48} ${s*0.65} L${s*0.60} ${s*0.55}"
        fill="none" stroke="#000" stroke-width="${s*0.025}" stroke-linecap="round" stroke-linejoin="round"/>

  <text x="${s*0.5}" y="${s*0.77}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="${s*0.065}" fill="#000">UOH</text>
</svg>`;
}

/** Splash screen icon */
function splashIconSvg(size) {
  const s = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2f8f71"/>
      <stop offset="100%" stop-color="#1a4f3f"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#ea580c"/>
    </linearGradient>
  </defs>

  <!-- Calendar icon (larger, centered) -->
  <rect x="${s*0.22}" y="${s*0.15}" width="${s*0.56}" height="${s*0.12}" rx="${s*0.03}" fill="url(#bg)"/>
  <rect x="${s*0.34}" y="${s*0.11}" width="${s*0.045}" height="${s*0.1}" rx="${s*0.02}" fill="url(#bg)"/>
  <rect x="${s*0.615}" y="${s*0.11}" width="${s*0.045}" height="${s*0.1}" rx="${s*0.02}" fill="url(#bg)"/>

  <rect x="${s*0.22}" y="${s*0.27}" width="${s*0.56}" height="${s*0.42}" rx="${s*0.03}" fill="url(#bg)"/>

  <!-- People -->
  <circle cx="${s*0.37}" cy="${s*0.42}" r="${s*0.055}" fill="${WHITE}"/>
  <circle cx="${s*0.37}" cy="${s*0.365}" r="${s*0.035}" fill="${WHITE}"/>

  <circle cx="${s*0.50}" cy="${s*0.40}" r="${s*0.065}" fill="url(#accent)"/>
  <circle cx="${s*0.50}" cy="${s*0.33}" r="${s*0.04}" fill="url(#accent)"/>

  <circle cx="${s*0.63}" cy="${s*0.42}" r="${s*0.055}" fill="${WHITE}"/>
  <circle cx="${s*0.63}" cy="${s*0.365}" r="${s*0.035}" fill="${WHITE}"/>

  <!-- Check mark -->
  <path d="M${s*0.40} ${s*0.55} L${s*0.47} ${s*0.62} L${s*0.62} ${s*0.50}"
        fill="none" stroke="${WHITE}" stroke-width="${s*0.03}" stroke-linecap="round" stroke-linejoin="round"/>

  <!-- App name -->
  <text x="${s*0.5}" y="${s*0.82}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="${s*0.09}" fill="url(#bg)">UOH Meetings</text>
  <text x="${s*0.5}" y="${s*0.92}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif"
        font-size="${s*0.045}" fill="#64748b">منصة الاجتماعات واللجان</text>
</svg>`;
}

/** Notification icon (simple, white on transparent) */
function notificationIconSvg(size) {
  const s = size;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <!-- Simple calendar with check -->
  <rect x="${s*0.2}" y="${s*0.15}" width="${s*0.6}" height="${s*0.12}" rx="${s*0.03}" fill="#FFF"/>
  <rect x="${s*0.33}" y="${s*0.1}" width="${s*0.05}" height="${s*0.1}" rx="${s*0.02}" fill="#FFF"/>
  <rect x="${s*0.62}" y="${s*0.1}" width="${s*0.05}" height="${s*0.1}" rx="${s*0.02}" fill="#FFF"/>
  <rect x="${s*0.2}" y="${s*0.27}" width="${s*0.6}" height="${s*0.5}" rx="${s*0.03}" fill="#FFF"/>
  <path d="M${s*0.35} ${s*0.50} L${s*0.47} ${s*0.62} L${s*0.65} ${s*0.42}"
        fill="none" stroke="#1e5f4c" stroke-width="${s*0.05}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

/** Web favicon SVG */
function faviconSvg(size) {
  const s = size;
  const r = s * 0.2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 ${s} ${s}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2f8f71"/>
      <stop offset="100%" stop-color="#1a4f3f"/>
    </linearGradient>
  </defs>
  <rect width="${s}" height="${s}" rx="${r}" ry="${r}" fill="url(#bg)"/>

  <!-- Simplified calendar + people for small size -->
  <rect x="${s*0.18}" y="${s*0.18}" width="${s*0.64}" height="${s*0.13}" rx="${s*0.04}" fill="#FFF" opacity="0.95"/>
  <rect x="${s*0.30}" y="${s*0.13}" width="${s*0.06}" height="${s*0.12}" rx="${s*0.03}" fill="#FFF"/>
  <rect x="${s*0.64}" y="${s*0.13}" width="${s*0.06}" height="${s*0.12}" rx="${s*0.03}" fill="#FFF"/>
  <rect x="${s*0.18}" y="${s*0.31}" width="${s*0.64}" height="${s*0.45}" rx="${s*0.04}" fill="#FFF" opacity="0.9"/>

  <!-- Simple check for small icon -->
  <path d="M${s*0.32} ${s*0.52} L${s*0.45} ${s*0.65} L${s*0.68} ${s*0.42}"
        fill="none" stroke="${BRAND}" stroke-width="${s*0.06}" stroke-linecap="round" stroke-linejoin="round"/>

  <text x="${s*0.5}" y="${s*0.88}" text-anchor="middle"
        font-family="Arial, Helvetica, sans-serif" font-weight="bold"
        font-size="${s*0.12}" fill="#FFF">UOH</text>
</svg>`;
}

// ------- Generate all icons -------
async function generateIcon(svgFn, outputPath, size) {
  const svg = Buffer.from(svgFn(size));
  await sharp(svg).resize(size, size).png().toFile(outputPath);
  console.log(`  ✓ ${outputPath} (${size}x${size})`);
}

async function main() {
  console.log('🎨 Generating UOH Meetings app icons...\n');

  const mobileAssets = join(ROOT, 'apps', 'mobile', 'assets');
  const webPublic = join(ROOT, 'apps', 'web', 'public');

  // Ensure directories exist
  if (!existsSync(webPublic)) mkdirSync(webPublic, { recursive: true });

  // === Mobile Icons ===
  console.log('📱 Mobile Icons:');

  // Main app icon (1024x1024 for iOS, Expo scales it)
  await generateIcon(mainIconSvg, join(mobileAssets, 'icon.png'), 1024);

  // Android adaptive icon foreground (432x432 for xxxhdpi)
  await generateIcon(androidForegroundSvg, join(mobileAssets, 'android-icon-foreground.png'), 432);

  // Android adaptive icon background
  await generateIcon(androidBackgroundSvg, join(mobileAssets, 'android-icon-background.png'), 432);

  // Android monochrome
  await generateIcon(monochromeSvg, join(mobileAssets, 'android-icon-monochrome.png'), 432);

  // Splash screen icon
  await generateIcon(splashIconSvg, join(mobileAssets, 'splash-icon.png'), 512);

  // Notification icon (96x96, white on transparent)
  await generateIcon(notificationIconSvg, join(mobileAssets, 'notification-icon.png'), 96);

  // Favicon for Expo web
  await generateIcon(faviconSvg, join(mobileAssets, 'favicon.png'), 48);

  // === Web Icons ===
  console.log('\n🌐 Web Icons:');

  // Favicon PNG (32x32)
  await generateIcon(faviconSvg, join(webPublic, 'favicon-32x32.png'), 32);

  // Favicon PNG (16x16)
  await generateIcon(faviconSvg, join(webPublic, 'favicon-16x16.png'), 16);

  // Apple touch icon (180x180)
  await generateIcon(mainIconSvg, join(webPublic, 'apple-touch-icon.png'), 180);

  // PWA icons
  await generateIcon(mainIconSvg, join(webPublic, 'icon-192.png'), 192);
  await generateIcon(mainIconSvg, join(webPublic, 'icon-512.png'), 512);

  // SVG favicon for web
  const svgFav = faviconSvg(32);
  const { writeFileSync } = await import('fs');
  writeFileSync(join(webPublic, 'favicon.svg'), svgFav);
  console.log(`  ✓ ${join(webPublic, 'favicon.svg')} (SVG)`);

  console.log('\n✅ All icons generated successfully!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
