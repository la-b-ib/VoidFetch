with open('background.txt', 'r') as f:
    content = f.read()

import re

# 1. Replace isTorDaemonRunning
content = re.sub(
    r'async function isTorDaemonRunning\(\) \{[\s\S]*?\} catch \(e\) \{\s*return false;\s*\}\s*\}',
    'async function isTorDaemonRunning() { return true; }',
    content
)

# 2. Replace configureTorProxy
content = re.sub(
    r'async function configureTorProxy\(enable\) \{[\s\S]*?\} catch \(err\) \{\s*console\.error\("VoidFetch: Proxy Configuration Error:", err\);\s*await new Promise\(\(resolve\) => chrome\.proxy\.settings\.clear\(\{ scope: \'regular\' \}, resolve\)\);\s*return \{ success: false, error: err\.message \};\s*\}\s*\}',
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

# 3. Fix the Gateway Fallback
content = re.sub(
    r'await chrome\.declarativeNetRequest\.updateDynamicRules\(\{\s*removeRuleIds: \[RULE_ID\],\s*addRules: \[\{\s*id: RULE_ID,\s*priority: 1,\s*action: \{\s*type: "redirect",\s*redirect: \{\s*\}\s*\},[\s\S]*?\}\]\s*\}\);\s*// The transform hostSuffix doesn\'t append, it replaces\. To append \.ly, we should use regexFilter and regexSubstitution\s*',
    '',
    content
)

with open('public/background.js', 'w') as f:
    f.write(content)
