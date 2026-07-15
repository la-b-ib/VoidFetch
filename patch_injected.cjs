const fs = require('fs');
let code = fs.readFileSync('public/injected.js', 'utf8');

// Replace the FormData parsing in fetch
code = code.replace(
  "bodyString = \"FormData(...)\";",
  `try {
              let fdEntries = [];
              for (let [key, value] of config.body.entries()) {
                if (value instanceof File) {
                  fdEntries.push(key + '=File(' + value.name + ')');
                } else {
                  fdEntries.push(key + '=' + value);
                }
              }
              bodyString = fdEntries.join('&');
            } catch (err) {
              bodyString = "FormData(...)";
            }`
);

fs.writeFileSync('public/injected.js', code);
