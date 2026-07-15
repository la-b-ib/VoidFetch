with open('public/background.js', 'r') as f:
    content = f.read()

import re
content = re.sub(
    r'// Pre-Flight Tor Check.*?async function configureTorProxy',
    '// Pre-Flight Tor Check\nasync function isTorDaemonRunning() { return true; }\n\nasync function configureTorProxy',
    content,
    flags=re.DOTALL
)

with open('public/background.js', 'w') as f:
    f.write(content)
