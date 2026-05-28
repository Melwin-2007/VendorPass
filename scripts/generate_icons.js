const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SVG_PATH = path.join(PROJECT_ROOT, 'assets', 'images', 'logo.svg');

// Check if SVG exists
if (!fs.existsSync(SVG_PATH)) {
  console.error(`Error: logo.svg not found at ${SVG_PATH}`);
  process.exit(1);
}

// 1. Ensure sharp is installed
try {
  require('sharp');
} catch (e) {
  console.log('Installing sharp library for high-quality PNG rendering...');
  execSync('npm install --no-save sharp', { cwd: PROJECT_ROOT, stdio: 'inherit' });
}

const sharp = require('sharp');

// Define the two SVG variations in memory
const svgContent = fs.readFileSync(SVG_PATH, 'utf8');

// A transparent version of the SVG for adaptive foreground & splash screen
const transparentSvgContent = svgContent
  .replace(/<rect[^>]*fill="url\(#bgGrad\)"[^>]*\/>/, '') // Remove background card
  .replace(/<rect[^>]*rx="32"[^>]*\/>/, ''); // Clean up any other background cards if present

async function generate() {
  console.log('Generating pixel-perfect PNG logo assets...');

  // 1. App Icon (1024x1024 with background)
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'icon.png'));
  console.log('✔ Generated icon.png (1024x1024)');

  // 2. Logo Glow (1024x1024 with background)
  await sharp(Buffer.from(svgContent))
    .resize(1024, 1024)
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'logo-glow.png'));
  console.log('✔ Overwrote logo-glow.png (1024x1024)');

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 15, g: 36, b: 48, alpha: 1 } // #0F2430 deep slate
    }
  })
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'android-icon-background.png'));
  console.log('✔ Generated android-icon-background.png (512x512 deep slate adaptive background)');

  // 4. Android Adaptive Foreground Icon (512x512 transparent)
  // Adaptive icons need safe padding so they aren't clipped by the launcher.
  // We'll compose the transparent shield logo centered inside a 512x512 transparent canvas.
  const transparentShield = await sharp(Buffer.from(transparentSvgContent))
    .resize(320, 320) // Resize the logo to fit within the 70% safe zone of 512x512
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: transparentShield, gravity: 'center' }])
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'android-icon-foreground.png'));
  console.log('✔ Generated android-icon-foreground.png (512x512 adaptive, padded & transparent)');

  // 6. Android Adaptive Monochrome Icon (512x512 transparent white)
  // A themed monochrome icon is standard white/transparent for Android 13+.
  const monochromeSvgContent = transparentSvgContent.replace(/#D4820A/g, '#FFFFFF');
  const monochromeShield = await sharp(Buffer.from(monochromeSvgContent))
    .resize(320, 320)
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: monochromeShield, gravity: 'center' }])
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'android-icon-monochrome.png'));
  console.log('✔ Generated android-icon-monochrome.png (512x512 adaptive monochrome)');

  // 7. Splash Screen Icon (512x512 transparent)
  await sharp(Buffer.from(transparentSvgContent))
    .resize(512, 512)
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'splash-icon.png'));
  console.log('✔ Generated splash-icon.png (512x512 transparent)');

  // 8. Favicon (48x48)
  await sharp(Buffer.from(svgContent))
    .resize(48, 48)
    .png()
    .toFile(path.join(PROJECT_ROOT, 'assets', 'images', 'favicon.png'));
  console.log('✔ Generated favicon.png (48x48)');

  console.log('All app logo assets have been generated successfully! 🚀');
}

generate().catch(err => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
