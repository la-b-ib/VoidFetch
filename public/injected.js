(function () {
  // 1. Cryptographic Handshake
  const token = crypto.randomUUID();
  
  // Send token to content_script.js
  document.dispatchEvent(new CustomEvent('VoidFetch_Handshake', {
    detail: { token: token }
  }));

  // 2. Custom Regex Payload Classification Engine
  const rules = {
    PII: {
      regex: /(?:\b\d{3}-\d{2}-\d{4}\b|\b(?:\d[ -]*?){13,16}\b)/, // SSN or Credit Card
      tier: 'HIGH'
    },
    Secrets: {
      regex: /(?:AKIA[0-9A-Z]{16}|sk-[a-zA-Z0-9]{32,}|ghp_[a-zA-Z0-9]{36})/,
      tier: 'CRITICAL'
    },
    SourceCode: {
      regex: /(?:function\s*\(|class\s+[a-zA-Z0-9_]+\s*\{|const\s+[a-zA-Z0-9_]+\s*=\s*\()/,
      tier: 'LOW'
    }
  };

  function analyzePayload(payloadString) {
    if (!payloadString) return { tier: 'LOW', categories: [] };
    
    let maxTier = 'LOW';
    let matchedCategories = [];

    const tierWeight = { 'LOW': 0, 'HIGH': 1, 'CRITICAL': 2 };

    for (const [category, rule] of Object.entries(rules)) {
      if (rule.regex.test(payloadString)) {
        matchedCategories.push(category);
        if (tierWeight[rule.tier] > tierWeight[maxTier]) {
          maxTier = rule.tier;
        }
      }
    }
    
    return { tier: maxTier, categories: matchedCategories };
  }

  // 3. Telemetry Relay
  function reportTelemetry(method, url, payload, startTime) {
    const startAnalysis = performance.now();
    const risk = analyzePayload(payload);
    const endAnalysis = performance.now();
    const overhead = (endAnalysis - startAnalysis).toFixed(2);
    
    // Relay if not blocked (blocking happens inline)
    window.postMessage({
      type: 'VoidFetch_Telemetry',
      token: token,
      data: {
        method: method.toUpperCase(),
        url: url,
        riskTier: risk.tier,
        categories: risk.categories,
        overheadMs: overhead,
        timestamp: Date.now(),
        payloadSnippet: payload ? payload.substring(0, 200) : '',
        payloadSize: payload ? payload.length : 0
      }
    }, '*');

    return risk;
  }

  // 4. XMLHttpRequest Patching
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  const originalXhrSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._voidFetchMethod = method;
    this._voidFetchUrl = url;
    return originalXhrOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const method = (this._voidFetchMethod || '').toUpperCase();
    
    if (['POST', 'PUT', 'PATCH'].includes(method) && body) {
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
      }
      const risk = analyzePayload(bodyString);
      if (risk.tier === 'CRITICAL') {
        // Block and mock 403
        Object.defineProperty(this, 'status', { value: 403 });
        Object.defineProperty(this, 'statusText', { value: 'Forbidden by VoidFetch DLP' });
        Object.defineProperty(this, 'readyState', { value: 4 });
        Object.defineProperty(this, 'responseText', { value: 'Blocked by VoidFetch DLP' });
        if (this.onreadystatechange) {
          this.onreadystatechange();
        }
        if (this.onerror) {
          this.onerror();
        }
        return; // Halt request
      } else {
        // Safe to send, report telemetry
        reportTelemetry(method, this._voidFetchUrl, bodyString, performance.now());
      }
    }
    return originalXhrSend.apply(this, arguments);
  };

  // 5. Fetch Patching
  const originalFetch = window.fetch;
    window.fetch = function(resource, config) {
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
  } catch (e) {}
})();
