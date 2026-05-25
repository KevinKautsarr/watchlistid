const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '..', 'assets', 'images');

// Helper to load SVG and update its viewBox
function getCroppedSvg(filename, newViewBox) {
  const filePath = path.join(IMAGES_DIR, filename);
  let svgContent = fs.readFileSync(filePath, 'utf8');

  // Replace or inject width, height, and viewBox
  // Remove existing width/height to let viewBox scale correctly
  svgContent = svgContent.replace(/<svg[^>]*>/, (match) => {
    // Strip existing width, height, viewBox
    let updated = match
      .replace(/\bwidth\s*=\s*"[^"]*"/g, '')
      .replace(/\bheight\s*=\s*"[^"]*"/g, '')
      .replace(/\bviewBox\s*=\s*"[^"]*"/g, '');
    
    // Insert new attributes
    return updated.replace('<svg', `<svg width="100%" height="100%" viewBox="${newViewBox}"`);
  });

  return Buffer.from(svgContent);
}

async function generate() {
  console.log('🚀 Starting PNG assets generation from SVGs...');

  try {
    // 1. App Icon (1024x1024)
    // Source: watchlistid_app_icon.svg (viewBox: 90 90 500 500)
    console.log('⏳ Generating app icon (icon.png)...');
    const appIconSvg = getCroppedSvg('watchlistid_app_icon.svg', '90 90 500 500');
    await sharp(appIconSvg)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(IMAGES_DIR, 'icon.png'));
    console.log('✅ Generated icon.png');

    // 2. Splash Icon (1024x1024)
    // Source: watchlistid_splash_icon.svg (viewBox: 0 0 680 680)
    console.log('⏳ Generating splash icon (splash-icon.png)...');
    const splashSvg = getCroppedSvg('watchlistid_splash_icon.svg', '0 0 680 680');
    await sharp(splashSvg)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(IMAGES_DIR, 'splash-icon.png'));
    console.log('✅ Generated splash-icon.png');

    // 3. Favicon (180x180)
    // Source: watchlistid_favicon.svg (viewBox: 40 64 260 260)
    console.log('⏳ Generating favicon (favicon.png)...');
    const faviconSvg = getCroppedSvg('watchlistid_favicon.svg', '40 64 260 260');
    await sharp(faviconSvg)
      .resize(180, 180)
      .png()
      .toFile(path.join(IMAGES_DIR, 'favicon.png'));
    console.log('✅ Generated favicon.png');

    // 4. Android Adaptive Background (1024x1024)
    // Source: watchlistid_android_adaptive.svg (viewBox: 20 90 200 200)
    console.log('⏳ Generating Android adaptive background...');
    const bgSvg = getCroppedSvg('watchlistid_android_adaptive.svg', '20 90 200 200');
    await sharp(bgSvg)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(IMAGES_DIR, 'android-icon-background.png'));
    console.log('✅ Generated android-icon-background.png');

    // 5. Android Adaptive Foreground (1024x1024)
    // Source: watchlistid_android_adaptive.svg (viewBox: 240 90 200 200)
    console.log('⏳ Generating Android adaptive foreground...');
    const fgSvg = getCroppedSvg('watchlistid_android_adaptive.svg', '240 90 200 200');
    await sharp(fgSvg)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(IMAGES_DIR, 'android-icon-foreground.png'));
    console.log('✅ Generated android-icon-foreground.png');

    // 6. Android Adaptive Monochrome (1024x1024)
    // Source: watchlistid_android_adaptive.svg (viewBox: 460 90 200 200)
    console.log('⏳ Generating Android adaptive monochrome...');
    const monoSvg = getCroppedSvg('watchlistid_android_adaptive.svg', '460 90 200 200');
    await sharp(monoSvg)
      .resize(1024, 1024)
      .png()
      .toFile(path.join(IMAGES_DIR, 'android-icon-monochrome.png'));
    console.log('✅ Generated android-icon-monochrome.png');

    // 7. OG Image (1200x630)
    // Source: watchlistid_og_image.svg (viewBox: 0 0 1200 630)
    console.log('⏳ Generating OG image (og_image.png)...');
    const ogSvg = getCroppedSvg('watchlistid_og_image.svg', '0 0 1200 630');
    await sharp(ogSvg)
      .resize(1200, 630)
      .png()
      .toFile(path.join(IMAGES_DIR, 'og_image.png'));
    console.log('✅ Generated og_image.png');

    // 8. Wordmark (680x140)
    // Source: watchlistid_wordmark.svg (viewBox: 0 0 680 140)
    console.log('⏳ Generating wordmark (wordmark.png)...');
    const wordmarkSvg = getCroppedSvg('watchlistid_wordmark.svg', '0 0 680 140');
    await sharp(wordmarkSvg)
      .resize(680, 140)
      .png()
      .toFile(path.join(IMAGES_DIR, 'wordmark.png'));
    console.log('✅ Generated wordmark.png');

    console.log('🎉 All assets generated successfully!');
  } catch (err) {
    console.error('❌ Error generating assets:', err);
  }
}

generate();
