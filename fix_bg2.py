import re

with open('public/background.js', 'r') as f:
    content = f.read()

# Replace the mangled isTorDaemonRunning
content = re.sub(
    r'async function isTorDaemonRunning\(\).*?\}\s*\}\s*\}',
    'async function isTorDaemonRunning() { return true; }',
    content,
    flags=re.DOTALL
)

with open('public/background.js', 'w') as f:
    f.write(content)
