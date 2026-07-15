with open('public/content_script.js', 'r') as f:
    content = f.read()

import re

content = re.sub(
    r'// 1\. Inject injected\.js into MAIN world\s*try \{[\s\S]*?\} catch \(e\) \{\s*console\.error\("VoidFetch: Failed to inject script", e\);\s*\}',
    '// 1. injected.js is now injected declaratively via manifest.json (world: "MAIN")',
    content
)

with open('public/content_script.js', 'w') as f:
    f.write(content)
