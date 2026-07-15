const fs = require('fs');
const sharp = require('sharp');
const { execSync } = require('child_process');

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="112" fill="#ffffff" />
  <ellipse cx="256" cy="256" rx="220" ry="140" fill="#000000" transform="rotate(-45 256 256)" />
  <path d="M 256 120 Q 256 256 120 256 Q 256 256 256 392 Q 256 256 392 256 Q 256 256 256 120 Z" fill="#ffffff" />
  <circle cx="380" cy="125" r="20" fill="#ffffff" />
</svg>
`;

fs.writeFileSync('public/icon.svg', svg);

async function main() {
  await sharp(Buffer.from(svg)).resize(16, 16).png().toFile('public/icon-16.png');
  await sharp(Buffer.from(svg)).resize(48, 48).png().toFile('public/icon-48.png');
  await sharp(Buffer.from(svg)).resize(128, 128).png().toFile('public/icon-128.png');
  console.log("Icons generated.");

  // Update package.json to use native zip
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.scripts.pack = "vite build && rm -f voidfetch-extension.zip && cd extension_ready && zip -r ../voidfetch-extension.zip .";
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

  console.log("Running pack...");
  execSync('npm run pack', { stdio: 'inherit' });
  console.log("Extension packaged successfully.");
}

main().catch(console.error);
