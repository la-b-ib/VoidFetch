import { InterceptLog, WhitelistEntry, Settings } from './types';

export const mockLogs: InterceptLog[] = Array.from({ length: 45 }).map((_, i) => {
  const actions: ('blocked' | 'encrypted' | 'allowed' | 'jit_justified' | 'tamper_attempt' | 'credential_reuse_blocked' | 'websocket_intercepted' | 'file_upload_blocked')[] = ['blocked', 'encrypted', 'allowed', 'jit_justified', 'tamper_attempt', 'credential_reuse_blocked', 'websocket_intercepted', 'file_upload_blocked'];
  const methods = ['POST', 'GET', 'PUT', 'DELETE', 'WSS'];
  const severities: ('info' | 'low' | 'medium' | 'high' | 'critical')[] = ['info', 'low', 'medium', 'high', 'critical'];
  const identities = ['user@company.com', 'dev@company.com', 'contractor@partner.com', 'service-account'];
  
  const action = actions[Math.floor(Math.random() * actions.length)];
  return {
    id: `log-${i}`,
    timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 60 * 48)).toISOString(),
    url: `https://api.external-${Math.floor(Math.random() * 5)}.com/v1/data`,
    method: methods[Math.floor(Math.random() * methods.length)],
    action,
    severity: severities[Math.floor(Math.random() * severities.length)],
    userIdentity: identities[Math.floor(Math.random() * identities.length)],
    policyRule: `Rule-${action.toUpperCase()}`,
    originalPayload: `{"data": "sample payload ${i}"}`,
    sensitiveFieldsDetected: action === 'blocked' ? ['SSN', 'API_KEY'] : undefined,
  };
}).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

export const mockWhitelist: WhitelistEntry[] = [
  { 
    id: '1', 
    domain: 'api.trusted.com', 
    type: 'domain',
    addedBy: 'MDM Sync', 
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    source: 'mdm',
    bypasses: { encryption: true, websockets: true, fileUploads: true },
    status: 'active',
    description: 'Core Trusted API for Internal Sync',
    conditions: {
      methods: ['GET', 'POST'],
      ipRanges: ['192.168.1.0/24', '10.0.0.0/8'],
    }
  },
  { 
    id: '2', 
    domain: '*.internal.company.com', 
    type: 'wildcard',
    addedBy: 'MDM Sync', 
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    source: 'mdm',
    bypasses: { encryption: true, websockets: false, fileUploads: false },
    status: 'active',
    description: 'Internal Services Network',
    conditions: {
      allowedUsers: ['admin@company.com', 'devops@company.com']
    }
  },
  { 
    id: '3', 
    domain: 'partner-api.com/v1/public/*', 
    type: 'path',
    addedBy: 'admin', 
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    source: 'local',
    bypasses: { encryption: false, websockets: true, fileUploads: false },
    status: 'active',
    description: 'Partner Data Stream (Read-only)',
    conditions: {
      methods: ['GET', 'OPTIONS'],
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString()
    }
  },
  { 
    id: '4', 
    domain: '^https:\\/\\/([a-z0-9]+)\\.staging\\.api\\.com\\/.*$', 
    type: 'regex',
    addedBy: 'security-admin', 
    addedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    source: 'mdm',
    bypasses: { encryption: true, websockets: true, fileUploads: true },
    status: 'expired',
    description: 'Temporary Staging Access for Q3 Testing',
    conditions: {
      expiresAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString()
    }
  }
];

export const mockSettings: Settings = {
  slackWebhook: 'https://hooks.slack.com/services/T0000/B000/XXX',
  emailAlerts: 'security@company.com',
  notifyOnBlock: true,
  notifyOnEncrypt: false,
  enableWebSockets: true,
  enableClipboard: true,
  enableWatermark: false,
  enableTamperProofWatermark: true,
  enableJIT: true,
  enableFileScanning: true,
  enableTenantRestrictions: true,
  enableCredentialShield: true,
  corporateTenantDomain: 'yourcompany.com',
  centralPolicyUrl: 'https://policy.company.internal/api/v1/config',
};
