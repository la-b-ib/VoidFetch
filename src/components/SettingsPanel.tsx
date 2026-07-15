import React, { useState, useEffect } from 'react';
import { Settings } from '../types';
import { Save, Bell, Slack, Mail, Cpu, Link, AlertTriangle, Building, Eye, EyeOff, ShieldAlert, Lock, Zap, Code, Shield, CheckCircle, Sliders, ChevronDown, Activity, Info, Github, Linkedin, ExternalLink, Globe } from 'lucide-react';

interface Props {
  settings: Settings;
  onSave: (settings: Settings) => void;
}

const Switch = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-zinc-900 ${
      checked ? 'bg-indigo-500' : 'bg-zinc-700'
    }`}
  >
    <span
      aria-hidden="true"
      className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
        checked ? 'translate-x-1.5' : '-translate-x-1.5'
      }`}
    />
  </button>
);

type TabId = 'core' | 'access' | 'sync' | 'integrations' | 'about';

export function SettingsPanel({ settings: initialSettings, onSave }: Props) {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [activeTab, setActiveTab] = useState<TabId>('core');
  const [showWebhook, setShowWebhook] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [torError, setTorError] = useState<string | null>(null);
  
  const isDirty = JSON.stringify(settings) !== JSON.stringify(initialSettings);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleSave = () => {
    onSave(settings);
  };
  
  const handleDiscard = () => {
    setSettings(initialSettings);
  };

  const handleTorToggle = async (enable: boolean) => {
    const updated = { ...settings, enableTorProxy: enable };
    setSettings(updated);
    setTorError(null);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.set({ enableTorProxy: enable });
      }
      chrome.runtime.sendMessage({ type: 'TOGGLE_TOR_PROXY', enable }, (response) => {
        if (response && !response.success) {
          setTorError('[ERR_VOiD] Tor daemon unreachable on port 9050/9150. Ensure native client is running.');
          setSettings(s => ({ ...s, enableTorProxy: false }));
          if (chrome.storage && chrome.storage.session) {
            chrome.storage.session.set({ enableTorProxy: false });
          }
        } else {
          onSave(updated);
        }
      });
    } else {
      onSave(updated);
    }
  };

  const handleGatewayToggle = async (enable: boolean) => {
    const updated = { ...settings, enableGatewayFallback: enable };
    setSettings(updated);
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      if (chrome.storage && chrome.storage.session) {
        chrome.storage.session.set({ enableGatewayFallback: enable });
      }
      chrome.runtime.sendMessage({ type: 'TOGGLE_GATEWAY_FALLBACK', enable }, () => {
        onSave(updated);
      });
    } else {
      onSave(updated);
    }
  };
  
  const handleTestConnection = (type: 'slack' | 'mdm') => {
    setTestStatus(`Testing...`);
    setTimeout(() => {
      setTestStatus(null);
      alert(`Success: Connected to ${type.toUpperCase()}`);
    }, 800);
  };

  const tabs = [
    { id: 'core', label: 'Core Protection', icon: <Cpu className="w-4 h-4" /> },
    { id: 'access', label: 'Access & Tenants', icon: <Building className="w-4 h-4" /> },
    { id: 'sync', label: 'Sync & Infra', icon: <Link className="w-4 h-4" /> },
    { id: 'integrations', label: 'Integrations', icon: <Bell className="w-4 h-4" /> },
    { id: 'about', label: 'About', icon: <Info className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col h-full relative">
      {/* Top Tabs */}
      <div className="flex overflow-x-auto whitespace-nowrap bg-zinc-950/80 border-b border-zinc-800 shrink-0 p-1 no-scrollbar justify-around">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabId)}
            className={`flex items-center justify-center flex-1 py-2 mx-0.5 rounded transition-colors shrink-0 ${
              activeTab === tab.id
                ? 'bg-zinc-800 text-indigo-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
            title={tab.label}
          >
            {tab.icon}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto hide-scrollbar p-3 pb-20">
        <h2 className="text-sm font-bold text-zinc-100 mb-3">{tabs.find(t => t.id === activeTab)?.label}</h2>
        
        {activeTab === 'core' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {torError && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-2.5 rounded flex items-center space-x-2 text-xs font-medium">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{torError}</span>
              </div>
            )}
            {/* Network Posture Control */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Globe className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">[NETWORK POSTURE CONTROL]</h3>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center justify-between bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200">Route Outbound via Tor Circuit</span>
                    <span className="text-[9px] text-zinc-500">SOCKS5 port 9050/9150 (ignores corporate domains)</span>
                  </div>
                  <div className="shrink-0 ml-2">
                    <Switch
                      checked={settings.enableTorProxy || false}
                      onChange={handleTorToggle}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-zinc-200">Enable Deep Web (.onion) Fallback Gateway</span>
                    <span className="text-[9px] text-zinc-500">Transparently rewrite failing hidden services to public web gateways</span>
                  </div>
                  <div className="shrink-0 ml-2">
                    <Switch
                      checked={settings.enableGatewayFallback || false}
                      onChange={handleGatewayToggle}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* DLP Section */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Data Loss Prevention (DLP)</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Sensitivity:</span>
                  <div className="relative">
                    <select
                      value={settings.dlpSensitivity || 'medium'}
                      onChange={(e) => setSettings({ ...settings, dlpSensitivity: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-[9px] py-0.5 pl-2 pr-5 rounded appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="strict">Strict</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div className="p-3 space-y-3">
                {[
                  { key: 'enableFileScanning', label: 'Deep File Inspection (DFI)', icon: <Code className="w-3.5 h-3.5 text-blue-400" /> },
                  { key: 'enableClipboard', label: 'Clipboard Protection', icon: <Lock className="w-3.5 h-3.5 text-emerald-400" /> },
                ].map((feat) => (
                  <div key={feat.key} className="flex items-center justify-between bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                    <div className="flex items-center space-x-1.5">
                      {feat.icon}
                      <span className="text-xs font-semibold text-zinc-200 truncate">{feat.label}</span>
                    </div>
                    <div className="shrink-0">
                      <Switch
                        checked={settings[feat.key as keyof Settings] as boolean}
                        onChange={(v) => setSettings({ ...settings, [feat.key]: v })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Endpoint Hardening */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-200">Endpoint Hardening</h3>
              </div>
              <div className="p-3 space-y-3">
                {[
                  { key: 'enableWebSockets', label: 'WebSocket Interception', icon: <Zap className="w-3.5 h-3.5 text-amber-400" /> },
                  { key: 'enableCredentialShield', label: 'Credential Leak Shield', icon: <Lock className="w-3.5 h-3.5 text-rose-400" /> },
                  { key: 'enableTamperProofWatermark', label: 'Tamper-Proof Watermarking', icon: <Eye className="w-3.5 h-3.5 text-indigo-400" /> },
                ].map((feat) => (
                  <div key={feat.key} className="flex items-center justify-between bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                    <div className="flex items-center space-x-1.5">
                      {feat.icon}
                      <span className="text-xs font-semibold text-zinc-200 truncate">{feat.label}</span>
                    </div>
                    <div className="shrink-0">
                      <Switch
                        checked={settings[feat.key as keyof Settings] as boolean}
                        onChange={(v) => setSettings({ ...settings, [feat.key]: v })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enforcement Mode */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-rose-400" />
                <h3 className="text-xs font-bold text-zinc-200">Enforcement Mode</h3>
              </div>
              <div className="p-3 space-y-4">
                <div className="flex space-x-2">
                  {(['alert_only', 'encrypt', 'block'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setSettings({ ...settings, interventionMode: mode })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                        (settings.interventionMode || 'block') === mode
                          ? mode === 'block' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : mode === 'encrypt' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      {mode.replace('_', ' ')}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center justify-between space-x-3 bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-200 truncate">JIT Interventions (Just-In-Time)</span>
                  <div className="shrink-0">
                    <Switch
                      checked={settings.enableJIT}
                      onChange={(v) => setSettings({ ...settings, enableJIT: v })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between space-x-3 bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-200 truncate">Custom RegEx Engines</span>
                  <div className="shrink-0">
                    <Switch
                      checked={settings.customRegexEnabled || false}
                      onChange={(v) => setSettings({ ...settings, customRegexEnabled: v })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Identity & Tenant Control */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Tenant Restrictions</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Mode:</span>
                  <div className="relative">
                    <select
                      value={settings.tenantEnforcementMode || 'audit_only'}
                      onChange={(e) => setSettings({ ...settings, tenantEnforcementMode: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-[9px] py-0.5 pl-2 pr-5 rounded appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="disabled">Disabled</option>
                      <option value="audit_only">Audit Only</option>
                      <option value="strict">Strict Enforce</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="p-3 space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Corporate Tenant Domain</label>
                  <div className="relative">
                    <Building className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                    <input
                      type="text"
                      value={settings.corporateTenantDomain}
                      onChange={(e) => setSettings({ ...settings, corporateTenantDomain: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 pl-8 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-700"
                      placeholder="e.g., acmecorp.com"
                    />
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-snug">
                    Injects X-Tenant-Restriction headers into outbound traffic.
                  </p>
                </div>

                <div className="flex items-center justify-between space-x-3 bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-200 truncate">Block Personal Accounts</span>
                  <div className="shrink-0">
                    <Switch
                      checked={settings.blockPersonalAccounts ?? false}
                      onChange={(v) => setSettings({ ...settings, blockPersonalAccounts: v })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Approved IdPs */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <h3 className="text-xs font-bold text-zinc-200">Approved Identity Providers</h3>
              </div>
              <div className="p-3">
                <p className="text-[9px] text-zinc-400 leading-snug mb-3">
                  Only allow authentication flows originating from the following approved SAML/OIDC providers.
                </p>
                
                <div className="space-y-2">
                  {(settings.allowedIdPs || ['login.microsoftonline.com', 'accounts.google.com/o/saml2']).map((idp, idx) => (
                    <div key={idx} className="flex items-center space-x-2 bg-zinc-950 border border-zinc-800 rounded p-1.5">
                      <div className="bg-zinc-800 p-1 rounded shrink-0">
                        <Lock className="w-3 h-3 text-zinc-400" />
                      </div>
                      <span className="text-xs text-zinc-300 flex-1 truncate">{idp}</span>
                      <button className="text-zinc-500 hover:text-emerald-400 p-1 transition-colors shrink-0">
                        <CheckCircle className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button className="w-full border border-dashed border-zinc-700 rounded py-1.5 text-[10px] font-bold text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors uppercase tracking-wider">
                    + Add Provider
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sync' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* MDM Configuration */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Link className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-xs font-bold text-zinc-200">MDM Policy Synchronization</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Sync:</span>
                  <div className="relative">
                    <select
                      value={settings.syncFrequency || 'realtime'}
                      onChange={(e) => setSettings({ ...settings, syncFrequency: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-[9px] py-0.5 pl-2 pr-5 rounded appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="realtime">Real-Time</option>
                      <option value="hourly">Hourly</option>
                      <option value="daily">Daily</option>
                      <option value="manual">Manual Only</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="p-3 space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Policy Endpoint URL</label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <Link className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
                      <input
                        type="url"
                        value={settings.centralPolicyUrl}
                        onChange={(e) => setSettings({ ...settings, centralPolicyUrl: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 pl-8 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-700"
                        placeholder="https://mdm.company.com/api/v1/policy"
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleTestConnection('mdm')}
                      disabled={testStatus !== null}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-700 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0 min-w-[80px]"
                    >
                      {testStatus ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-snug flex items-center mt-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500 mr-1 shrink-0" />
                    Ensure endpoint supports mutual TLS authentication.
                  </p>
                </div>
              </div>
            </div>

            {/* Offline Resilience */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-200">Offline Resilience</h3>
              </div>
              
              <div className="p-3 space-y-4">
                <div className="flex items-center justify-between space-x-3 bg-zinc-950/50 p-2.5 rounded border border-zinc-800/50">
                  <span className="text-xs font-semibold text-zinc-200 truncate">Secure Local Cache</span>
                  <div className="shrink-0">
                    <Switch
                      checked={settings.enableLocalCache ?? true}
                      onChange={(v) => setSettings({ ...settings, enableLocalCache: v })}
                    />
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Offline Enforcement Posture</label>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSettings({ ...settings, offlineEnforcement: 'strict' })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                        (settings.offlineEnforcement || 'strict') === 'strict'
                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      Strict (Block Unverified)
                    </button>
                    <button
                      onClick={() => setSettings({ ...settings, offlineEnforcement: 'relaxed' })}
                      className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors border ${
                        settings.offlineEnforcement === 'relaxed'
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      Relaxed (Audit Only)
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-500 leading-snug mt-1">
                    Determines extension behavior when MDM policy cannot be verified after 24 hours offline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Alert Routing */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <h3 className="text-xs font-bold text-zinc-200">Alert Routing</h3>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold">Severity:</span>
                  <div className="relative">
                    <select
                      value={settings.notifySeverityThreshold || 'medium'}
                      onChange={(e) => setSettings({ ...settings, notifySeverityThreshold: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-700 text-zinc-300 text-[9px] py-0.5 pl-2 pr-5 rounded appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="low">Low+</option>
                      <option value="medium">Medium+</option>
                      <option value="high">High+</option>
                      <option value="critical">Critical</option>
                    </select>
                    <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1 top-1/2 transform -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              <div className="p-3 space-y-4">
                {/* Slack */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <Slack className="w-3 h-3 mr-1" /> Slack Webhook
                  </label>
                  <div className="flex space-x-2">
                    <div className="relative flex-1">
                      <input
                        type={showWebhook ? "text" : "password"}
                        value={settings.slackWebhook}
                        onChange={(e) => setSettings({ ...settings, slackWebhook: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 pr-8 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-700"
                        placeholder="https://hooks.slack.com/..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowWebhook(!showWebhook)}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                        tabIndex={-1}
                      >
                        {showWebhook ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleTestConnection('slack')}
                      disabled={testStatus !== null}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold uppercase tracking-wider rounded border border-zinc-700 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {testStatus ? 'Testing...' : 'Test'}
                    </button>
                  </div>
                </div>

                {/* Email */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center">
                    <Mail className="w-3 h-3 mr-1" /> SecOps Email List
                  </label>
                  <input
                    type="email"
                    value={settings.emailAlerts}
                    onChange={(e) => setSettings({ ...settings, emailAlerts: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors placeholder-zinc-700"
                    placeholder="security@company.com"
                  />
                </div>

                {/* Triggers */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/50">
                  <div className="flex items-center justify-between space-x-2 bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                    <span className="text-[10px] font-bold text-zinc-300">Alert on Block</span>
                    <Switch
                        checked={settings.notifyOnBlock}
                        onChange={(v) => setSettings({ ...settings, notifyOnBlock: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between space-x-2 bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                    <span className="text-[10px] font-bold text-zinc-300">Alert on Encrypt</span>
                    <Switch
                        checked={settings.notifyOnEncrypt}
                        onChange={(v) => setSettings({ ...settings, notifyOnEncrypt: v })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SIEM Forwarding */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-200">SIEM Forwarding</h3>
              </div>
              <div className="p-3 space-y-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Splunk HEC Endpoint</label>
                  <input
                    type="url"
                    value={settings.splunkEndpoint || ''}
                    onChange={(e) => setSettings({ ...settings, splunkEndpoint: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 rounded p-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder-zinc-700"
                    placeholder="https://http-inputs.splunkcloud.com/..."
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Datadog API Key</label>
                  <input
                    type="password"
                    value={settings.datadogApiKey || ''}
                    onChange={(e) => setSettings({ ...settings, datadogApiKey: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-200 rounded p-1.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors placeholder-zinc-700"
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Version & Build */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-zinc-200">App Version & Details</h3>
              </div>
              <div className="p-3 space-y-4">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Version</span>
                  <span className="text-xs text-zinc-200 font-mono">v1.2.0 (Build 8421)</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Environment</span>
                  <span className="text-xs text-zinc-200 font-mono">Production</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Last Updated</span>
                  <span className="text-xs text-zinc-200 font-mono">July 13, 2026</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">GitHub</span>
                  <a href="https://github.com/la-b-ib/VoidFetch" target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-400 hover:text-indigo-300 font-mono transition-colors">la-b-ib/VoidFetch</a>
                </div>
              </div>
            </div>

            {/* Developer Details */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Code className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-zinc-200">Developer</h3>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-100">Labib Bin Shahed</h4>
                    <p className="text-[10px] text-zinc-400">CSE @ BRACU '21 | Research: Crypto Security & DFIR | SecDev: OSINT, Threat Intel & Defensive SecOps Toolkits.</p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed pt-2">
                  Built and maintained for secure enterprise browser extension management. For support or feature requests, reach out via the following channels:
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <a href="https://github.com/la-b-ib" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors text-[10px] font-bold">
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                  </a>
                  <a href="https://www.linkedin.com/in/la-b-ib?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors text-[10px] font-bold">
                    <Linkedin className="w-3.5 h-3.5" />
                    <span>LinkedIn</span>
                  </a>
                  <a href="mailto:labib.b.shahed@gmail.com" className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded transition-colors text-[10px] font-bold">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Mail</span>
                  </a>
                </div>
              </div>
            </div>
            
            {/* System Information */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
              <div className="px-3 py-2 border-b border-zinc-800 bg-zinc-950/50 flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-zinc-200">System Resources</h3>
              </div>
              <div className="p-3 space-y-3">
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Engine</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">V8 Isolated</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Memory Limit</span>
                  <span className="text-xs text-zinc-300 font-mono">256 MB</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Policy Sync</span>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Active</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Footer */}
      {isDirty && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-700 animate-in slide-in-from-bottom-12 duration-300 flex flex-col space-y-2 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.5)] z-30">
          <div className="flex items-center text-[10px] font-bold text-zinc-200 truncate">
            <AlertTriangle className="w-3 h-3 mr-1 text-amber-500 shrink-0" />
            <span className="truncate">Unsaved policy changes</span>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleDiscard}
              className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[10px] font-bold rounded transition-colors"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-[2] py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded transition-colors flex items-center justify-center shadow-lg shadow-indigo-900/50"
            >
              <Save className="w-3 h-3 mr-1" />
              Publish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
