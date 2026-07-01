import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const resourcesDir = join(root, 'resources');
const playStoreIcon = join(resourcesDir, 'play-store-icon.png');
const iconSvg = join(resourcesDir, 'icon.svg');
const iconPng = join(resourcesDir, 'icon.png');
const splashPng = join(resourcesDir, 'splash.png');
const featureGraphic = join(resourcesDir, 'feature-graphic.png');

mkdirSync(resourcesDir, { recursive: true });

/** Prefer the official 512×512 Play Store icon when present. */
async function loadIconBuffer() {
  if (existsSync(playStoreIcon)) {
    return sharp(playStoreIcon).resize(1024, 1024).png().toBuffer();
  }
  if (existsSync(iconSvg)) {
    return sharp(readFileSync(iconSvg)).resize(1024, 1024).png().toBuffer();
  }
  throw new Error('No icon source found. Add resources/play-store-icon.png');
}

const iconBuffer = await loadIconBuffer();
await sharp(iconBuffer).toFile(iconPng);

await sharp({
  create: {
    width: 2732,
    height: 2732,
    channels: 4,
    background: '#0a1f1a',
  },
})
  .composite([
    {
      input: await sharp(iconBuffer).resize(900, 900).png().toBuffer(),
      gravity: 'center',
    },
  ])
  .png()
  .toFile(splashPng);

const featureTextSvg = Buffer.from(`<svg width="1024" height="500" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#051a14"/>
      <stop offset="55%" stop-color="#0f2a24"/>
      <stop offset="100%" stop-color="#1a3a34"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="500" fill="url(#bg)"/>
  <text x="430" y="195" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="72" font-weight="700" fill="#ffffff">SYNC</text><text x="618" y="195" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="72" font-weight="700" fill="#f97316">Pedia</text>
  <text x="430" y="255" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="28" fill="#d1d5db">Learn · Earn · Connect</text>
  <text x="430" y="310" font-family="system-ui, -apple-system, Segoe UI, sans-serif" font-size="22" fill="#9ca3af">Communities · Internships · Certifications · Coins</text>
</svg>`);

const iconForBanner = await sharp(iconBuffer).resize(360, 360).png().toBuffer();

await sharp(featureTextSvg)
  .composite([{ input: iconForBanner, left: 40, top: 70 }])
  .png()
  .toFile(featureGraphic);

const androidRes = join(root, 'android', 'app', 'src', 'main', 'res');
const launcherSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

if (existsSync(androidRes)) {
  for (const [folder, size] of Object.entries(launcherSizes)) {
    const dir = join(androidRes, folder);
    mkdirSync(dir, { recursive: true });
    const launcher = await sharp(iconBuffer).resize(size, size).png().toBuffer();
    await sharp(launcher).toFile(join(dir, 'ic_launcher.png'));
    await sharp(launcher).toFile(join(dir, 'ic_launcher_round.png'));
    await sharp(launcher).toFile(join(dir, 'ic_launcher_foreground.png'));
  }

  const splashDir = join(androidRes, 'drawable');
  mkdirSync(splashDir, { recursive: true });
  await sharp(splashPng).resize(1080, 1920, { fit: 'cover' }).png().toFile(join(splashDir, 'splash.png'));

  const splashPortrait = join(androidRes, 'drawable-port-mdpi');
  mkdirSync(splashPortrait, { recursive: true });
  await sharp(splashPng).resize(320, 480, { fit: 'cover' }).png().toFile(join(splashPortrait, 'splash.png'));

  console.log('Updated Android launcher and splash assets.');
}

console.log('Assets ready:');
console.log(' - resources/play-store-icon.png (512×512 — upload to Play Console)');
console.log(' - resources/feature-graphic.png (1024×500 — upload to Play Console)');
console.log(' - resources/icon.png, splash.png (native app)');
