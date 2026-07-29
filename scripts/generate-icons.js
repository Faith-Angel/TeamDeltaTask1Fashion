const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [192, 512];
const outputDir = path.join(__dirname, '..', 'public', 'icons');

// Create a simple SVG icon (green fashion-themed icon)
const svgIcon = (size) => `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#558B2F"/>
  <text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="bold" 
        font-size="${size * 0.4}px" fill="white">N</text>
  <text x="50%" y="${size * 0.78}" dominant-baseline="middle" text-anchor="middle" 
        font-family="Arial, sans-serif" font-weight="normal" 
        font-size="${size * 0.12}px" fill="#FAFAF5">ndolo</text>
</svg>
`;

async function generateIcons() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const size of sizes) {
    const svgBuffer = Buffer.from(svgIcon(size));
    
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(outputDir, `icon-${size}x${size}.png`));
    
    console.log(`Generated icon-${size}x${size}.png`);
  }

  console.log('All icons generated successfully!');
}

generateIcons().catch(console.error);

