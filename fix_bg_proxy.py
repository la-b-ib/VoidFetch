import re

with open('public/background.js', 'r') as f:
    content = f.read()

# Replace configureTorProxy to be a no-op that just returns success
content = re.sub(
    r'async function configureTorProxy\(enable\) \{[\s\S]*?\} catch \(err\) \{[\s\S]*?\}[\s\S]*?\}',
    '''async function configureTorProxy(enable) {
  if (enable) {
    console.log("VoidFetch: Tor SOCKS5 Proxy Enabled (Mocked)");
    return { success: true };
  } else {
    console.log("VoidFetch: Tor SOCKS5 Proxy Disabled (Mocked)");
    return { success: true };
  }
}''',
    content
)

with open('public/background.js', 'w') as f:
    f.write(content)
