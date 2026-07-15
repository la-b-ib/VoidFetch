
export type ActionType = 'encrypted' | 'blocked' | 'allowed' | 'jit_justified' | 'clipboard_blocked' | 'oauth_tracked' | 'websocket_intercepted' | 'file_upload_blocked' | 'tamper_attempt' | 'credential_reuse_blocked';

export interface InterceptLog {
  id: string;
  timestamp: string;
  url: string;
  method: string;
  action: ActionType;
  sensitiveFieldsDetected?: string[];
  payloadSize?: number;
  justification?: string;
  userIdentity?: string;
  policyRule?: string;
  severity?: 'info' | 'low' | 'medium' | 'high' | 'critical';
  originalPayload?: string;
  transmittedPayload?: string;
  telemetryFlag?: string;
}

export interface WhitelistEntry {
  id: string;
  domain: string;
  type: 'domain' | 'wildcard' | 'path' | 'ip_range' | 'regex';
  addedBy: string;
  addedAt: string;
  source: 'mdm' | 'local';
  bypasses: {
    encryption: boolean;
    websockets: boolean;
    fileUploads: boolean;
  };
  conditions?: {
    methods?: string[];
    expiresAt?: string;
    ipRanges?: string[];
    allowedUsers?: string[];
  };
  status?: 'active' | 'expired' | 'revoked';
  description?: string;
}

export interface Settings {
  slackWebhook: string;
  emailAlerts: string;
  notifyOnBlock: boolean;
  notifyOnEncrypt: boolean;
  enableWebSockets: boolean;
  enableClipboard: boolean;
  enableWatermark: boolean;
  enableTamperProofWatermark: boolean;
  enableJIT: boolean;
  enableFileScanning: boolean;
  enableTenantRestrictions: boolean;
  enableCredentialShield: boolean;
  corporateTenantDomain: string;
  centralPolicyUrl: string;
  dlpSensitivity?: 'low' | 'medium' | 'high' | 'strict';
  interventionMode?: 'block' | 'encrypt' | 'alert_only';
  customRegexEnabled?: boolean;
  tenantEnforcementMode?: 'strict' | 'audit_only' | 'disabled';
  blockPersonalAccounts?: boolean;
  allowedIdPs?: string[];
  syncFrequency?: 'realtime' | 'hourly' | 'daily' | 'manual';
  enableLocalCache?: boolean;
  offlineEnforcement?: 'strict' | 'relaxed';
  splunkEndpoint?: string;
  datadogApiKey?: string;
  notifySeverityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  enableTorProxy?: boolean;
  enableGatewayFallback?: boolean;
}
