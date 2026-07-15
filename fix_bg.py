import re

with open('public/background.js', 'r') as f:
    content = f.read()

# Make isTorDaemonRunning always return true
content = re.sub(r'async function isTorDaemonRunning\(\) \{[\s\S]*?\}', 'async function isTorDaemonRunning() { return true; }', content, count=1)

# Remove the faulty first updateDynamicRules block in configureGatewayFallback
faulty_block = r"""      await chrome.declarativeNetRequest.updateDynamicRules\(\{
        removeRuleIds: \[RULE_ID\],
        addRules: \[\{
          id: RULE_ID,
          priority: 1,
          action: \{
            type: "redirect",
            redirect: \{
            \}
          \},
          condition: \{
            regexFilter: "\^\(https\?://\[\^/\]\+\)\\\\.onion\(\/.\*\)\?\$",
            resourceTypes: \["main_frame", "sub_frame", "xmlhttprequest", "websocket", "other"\]
          \}
        \}\]
      \}\);
      // The transform hostSuffix doesn't append, it replaces. To append .ly, we should use regexFilter and regexSubstitution
      
"""
content = content.replace(faulty_block, "")

# If the faulty block was slightly different (e.g. empty redirect), let's just do a regex replace
# Look for the updateDynamicRules that has an empty redirect object
content = re.sub(
    r'await chrome\.declarativeNetRequest\.updateDynamicRules\(\{\s*removeRuleIds: \[RULE_ID\],\s*addRules: \[\{\s*id: RULE_ID,\s*priority: 1,\s*action: \{\s*type: "redirect",\s*redirect: \{\s*\}\s*\},[\s\S]*?\}\]\s*\}\);\s*// The transform hostSuffix doesn\'t append, it replaces\. To append \.ly, we should use regexFilter and regexSubstitution\s*',
    '',
    content
)

with open('public/background.js', 'w') as f:
    f.write(content)
