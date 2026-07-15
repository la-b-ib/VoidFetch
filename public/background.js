chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

const MAX_LOGS = 1000;
const BYPASS_LIST = ['localhost', '127.0.0.1', '*.corp.internal'];

// Pre-Flight Tor Check
async function isTorDaemonRunning() { return true; }

async function configureTorProxy(enable) {
  if (enable) {
    console.log("VoidFetch: Tor SOCKS5 Proxy Enabled (Mocked)");
    return { success: true };
  } else {
    console.log("VoidFetch: Tor SOCKS5 Proxy Disabled (Mocked)");
    return { success: true };
  }
}

async function configureGatewayFallback(enable) {
  try {
    const RULE_ID = 1;
    if (enable) {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID],
        addRules: [{
          id: RULE_ID,
          priority: 1,
          action: {
            type: "redirect",
            redirect: {
              regexSubstitution: "\\1.onion.ly\\2"
            }
          },
          condition: {
            regexFilter: "^(https?://[^/]+)\\.onion(/.*)?$",
            resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "websocket", "other", "script", "image", "stylesheet"]
          }
        }]
      });
      
      console.log("VoidFetch: Deep Web Gateway Fallback Enabled");
      return { success: true };
    } else {
      await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [RULE_ID]
      });
      console.log("VoidFetch: Deep Web Gateway Fallback Disabled");
      return { success: true };
    }
  } catch (err) {
    console.error("VoidFetch: Gateway Configuration Error:", err);
    return { success: false, error: err.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TELEMETRY_LOG') {
    handleTelemetry(message.payload, sender);
    return false;
  }
  
  if (message.type === 'TOGGLE_TOR_PROXY') {
    configureTorProxy(message.enable).then(sendResponse);
    return true; // Async response
  }
  
  if (message.type === 'TOGGLE_GATEWAY_FALLBACK') {
    configureGatewayFallback(message.enable).then(sendResponse);
    return true; // Async response
  }
  
  return false;
});

async function handleTelemetry(data, sender) {
  try {
    const tab = sender.tab;
    const tabId = tab ? tab.id : -1;
    
    let action = data.riskTier === 'CRITICAL' ? 'blocked' : (data.riskTier === 'HIGH' ? 'encrypted' : 'allowed');
    let telemetryFlag = null;
    if (data.url && data.url.includes('.onion.ly')) {
      telemetryFlag = 'ANONYMOUS_ROUTING';
    }

    const enrichedLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(data.timestamp).toISOString(),
      url: data.url,
      method: data.method,
      action: action,
      sensitiveFieldsDetected: data.categories,
      payloadSize: data.payloadSize !== undefined ? data.payloadSize : (data.payloadSnippet ? data.payloadSnippet.length : 0),
      severity: data.riskTier.toLowerCase(),
      originalPayload: data.payloadSnippet,
      telemetryFlag: telemetryFlag,
      tabId: tabId,
      tabTitle: tab ? tab.title : 'Unknown',
      tabFavIcon: tab ? tab.favIconUrl : '',
      overheadMs: data.overheadMs
    };

    const sessionData = await chrome.storage.local.get(['logs']);
    let logs = sessionData.logs || [];
    
    logs.unshift(enrichedLog);
    if (logs.length > MAX_LOGS) {
      logs = logs.slice(0, MAX_LOGS);
    }
    
    await chrome.storage.local.set({ logs: logs });
  } catch (err) {
    console.error("VoidFetch Background Error:", err);
  }
}

// Garbage Collection
chrome.tabs.onRemoved.addListener(async (tabId) => {
  try {
    const sessionData = await chrome.storage.local.get(['logs']);
    let logs = sessionData.logs || [];
    
    const filteredLogs = logs.filter(log => log.tabId !== tabId);
    
    if (filteredLogs.length !== logs.length) {
      await chrome.storage.local.set({ logs: filteredLogs });
    }
  } catch (err) {
    console.error("VoidFetch Tab GC Error:", err);
  }
});
