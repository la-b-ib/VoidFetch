import json

with open('public/manifest.json', 'r') as f:
    manifest = json.load(f)

manifest['content_scripts'] = [
    {
      "matches": [ "<all_urls>" ],
      "js": [ "content_script.js" ],
      "run_at": "document_start",
      "all_frames": True
    },
    {
      "matches": [ "<all_urls>" ],
      "js": [ "injected.js" ],
      "run_at": "document_start",
      "all_frames": True,
      "world": "MAIN"
    }
]

with open('public/manifest.json', 'w') as f:
    json.dump(manifest, f, indent=2)
