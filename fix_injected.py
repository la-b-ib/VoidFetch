import re

with open('public/injected.js', 'r') as f:
    content = f.read()

# Replace window.fetch = async function(resource, config) { ... }
# with window.fetch = function(resource, config) { return new Promise((resolve, reject) => { ... }); }
# Actually, the easiest way to avoid `async function` signature is just:
# window.fetch = function(resource, config) { return (async () => { ... })().then(...) }

replacement = """  window.fetch = function(resource, config) {
    return (async () => {
      let method = 'GET';
      let url = '';
      
      if (typeof resource === 'string') {
        url = resource;
      } else if (resource instanceof Request) {
        url = resource.url;
        method = resource.method;
      }
      
      if (config && config.method) {
        method = config.method.toUpperCase();
      }
      
      if (['POST', 'PUT', 'PATCH'].includes(method)) {
        let bodyString = '';
        let shouldBlock = false;
        let startProcess = performance.now();
        
        try {
          if (config && config.body) {
            if (typeof config.body === 'string') {
              bodyString = config.body;
            } else if (config.body instanceof FormData) { 
               try {
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
              } 
             }
          } else if (resource instanceof Request) {
            const clone = resource.clone();
            bodyString = await clone.text();
          }
          
          if (bodyString) {
            const risk = analyzePayload(bodyString);
            if (risk.tier === 'CRITICAL') {
              shouldBlock = true;
            } else {
              const endAnalysis = performance.now();
              window.postMessage({
                type: 'VoidFetch_Telemetry',
                token: token,
                data: {
                  method: method,
                  url: url,
                  riskTier: risk.tier,
                  categories: risk.categories,
                  overheadMs: (endAnalysis - startProcess).toFixed(2),
                  timestamp: Date.now(),
                  payloadSnippet: bodyString.substring(0, 200),
                  payloadSize: bodyString.length
                }
              }, '*');
            }
          }
        } catch (e) {
          console.error("VoidFetch: Error analyzing fetch", e);
        }
        
        if (shouldBlock) {
          return new Response('Blocked by VoidFetch DLP', {
            status: 403,
            statusText: 'Forbidden',
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
      
      return originalFetch.apply(window, [resource, config]);
    })();
  };
  
  // Try to hide the patch
  try {
    window.fetch.toString = () => "function fetch() { [native code] }";
  } catch (e) {}"""

content = re.sub(r'window\.fetch = async function\(resource, config\) \{[\s\S]*?return originalFetch\.apply\(this, arguments\);\s*\};', replacement, content)

with open('public/injected.js', 'w') as f:
    f.write(content)
