(function() {
  let validationToken = null;

  // 1. injected.js is now injected declaratively via manifest.json (world: "MAIN")

  // 2. Catch initial handshake
  document.addEventListener('VoidFetch_Handshake', (e) => {
    if (e.detail && e.detail.token) {
      validationToken = e.detail.token;
    }
  }, { once: true });

  // 3. Listen for window.postMessage from injected.js
  window.addEventListener('message', (event) => {
    if (event.source !== window || !event.data) return;

    if (event.data.type === 'VoidFetch_Telemetry') {
      // Cryptographic Validation
      if (!validationToken || event.data.token !== validationToken) {
        console.warn("VoidFetch: Invalid token in postMessage bridge.");
        return;
      }

      // 4. Relay to background service worker safely
      try {
        if (!chrome.runtime?.id) {
          throw new Error("Extension context invalidated");
        }
        chrome.runtime.sendMessage({
          type: 'TELEMETRY_LOG',
          payload: event.data.data
        });
      } catch (err) {
        // Orphan Script / Context Invalidation fallback
        console.warn("VoidFetch: Cannot send message to background.", err);
      }
    }
  });
})();
