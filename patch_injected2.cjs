const fs = require('fs');
let code = fs.readFileSync('public/injected.js', 'utf8');

code = code.replace(
  "if (['POST', 'PUT', 'PATCH'].includes(method) && typeof body === 'string') {",
  `if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
      let bodyString = '';
      if (typeof body === 'string') {
        bodyString = body;
      } else if (body instanceof FormData) {
        try {
          let fdEntries = [];
          for (let [key, value] of body.entries()) {
            if (value instanceof File) {
              fdEntries.push(key + '=File(' + value.name + ')');
            } else {
              fdEntries.push(key + '=' + value);
            }
          }
          bodyString = fdEntries.join('&');
        } catch (err) {
          bodyString = "FormData(...)";
        }
      }`
);

// We need to fix the variable name in XMLHttpRequest to `bodyString` instead of `body`.
code = code.replace(
  "const risk = analyzePayload(body);",
  "const risk = analyzePayload(bodyString);"
);

code = code.replace(
  "reportTelemetry(method, this._voidFetchUrl, body, performance.now());",
  "reportTelemetry(method, this._voidFetchUrl, bodyString, performance.now());"
);

fs.writeFileSync('public/injected.js', code);
