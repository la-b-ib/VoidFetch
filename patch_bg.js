const fs = require('fs');
let code = fs.readFileSync('public/background.js', 'utf8');

code = code.replace(
  "if (data.url && data.url.includes('.onion.ly')) {\n      // It's using anonymous routing gateway\n      action = 'oauth_tracked'; // repurposing an allowed-like action, or we can just append tag\n    }",
  "let telemetryFlag = null;\n    if (data.url && data.url.includes('.onion.ly')) {\n      telemetryFlag = 'ANONYMOUS_ROUTING';\n    }"
);

code = code.replace(
  "originalPayload: data.payloadSnippet,",
  "originalPayload: data.payloadSnippet,\n      telemetryFlag: telemetryFlag,"
);

fs.writeFileSync('public/background.js', code);
