const fs = require('fs');
let manifest = JSON.parse(fs.readFileSync('public/manifest.json', 'utf8'));

manifest.icons = {
  "16": "icon-16.png",
  "48": "icon-48.png",
  "128": "icon-128.png"
};

manifest.action = manifest.action || {};
manifest.action.default_icon = {
  "16": "icon-16.png",
  "48": "icon-48.png",
  "128": "icon-128.png"
};

fs.writeFileSync('public/manifest.json', JSON.stringify(manifest, null, 2));
console.log('Manifest patched.');
