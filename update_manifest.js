import fs from 'fs';
const manifestPath = 'public/manifest.json';
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

if (!manifest.permissions.includes('proxy')) {
  manifest.permissions.push('proxy');
}
if (!manifest.permissions.includes('declarativeNetRequest')) {
  manifest.permissions.push('declarativeNetRequest');
}

fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
