import React, { useState, useEffect } from 'react';
import { WhitelistEntry } from '../types';
import { Trash2, Plus, ShieldCheck, Lock, User, Globe, Shield, Radio, UploadCloud, ChevronDown, CheckCircle2, Clock, Network, Fingerprint, Activity, Tag, Settings2 } from 'lucide-react';

interface Props {
  whitelist: WhitelistEntry[];
  onAdd: (entry: Pick<WhitelistEntry, 'domain' | 'type' | 'bypasses' | 'conditions' | 'description'>) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, updates: Partial<WhitelistEntry>) => void;
}

export function WhitelistManager({ whitelist, onAdd, onRemove, onUpdate }: Props) {
  const [newDomain, setNewDomain] = useState('');
  const [ruleType, setRuleType] = useState<'domain' | 'wildcard' | 'path' | 'ip_range' | 'regex'>('domain');
  const [activeTabDomain, setActiveTabDomain] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced fields
  const [description, setDescription] = useState('');
  const [expiry, setExpiry] = useState<'none' | '1h' | '24h' | '7d'>('none');
  const [methods, setMethods] = useState<string[]>(['GET', 'POST']);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url) {
          try {
            const url = new URL(tabs[0].url);
            setActiveTabDomain(url.hostname);
          } catch (e) {
            // Invalid URL
          }
        }
      });
    } else {
      setActiveTabDomain('github.com');
    }
  }, []);

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (newDomain.trim()) {
      let expiresAt: string | undefined = undefined;
      if (expiry === '1h') expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
      if (expiry === '24h') expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
      if (expiry === '7d') expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();
      
      onAdd({
        domain: newDomain.trim(),
        type: ruleType,
        description: description.trim() || undefined,
        conditions: (showAdvanced && (expiresAt || methods.length > 0)) ? {
          expiresAt,
          methods: methods.length > 0 ? methods : undefined
        } : undefined,
        bypasses: { encryption: true, websockets: true, fileUploads: true }
      });
      setNewDomain('');
      setDescription('');
      setExpiry('none');
      setShowAdvanced(false);
    }
  };

  const handleTrustActive = () => {
    if (activeTabDomain) {
      onAdd({
        domain: activeTabDomain,
        type: 'domain',
        bypasses: { encryption: true, websockets: true, fileUploads: true }
      });
    }
  };

  const toggleMethod = (m: string) => {
    setMethods(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  return (
    <div className="flex flex-col h-full space-y-4 pb-4">
      {activeTabDomain && !whitelist.some(w => w.domain === activeTabDomain) && (
        <div className="bg-zinc-900 border border-indigo-500/30 rounded-lg overflow-hidden flex flex-col relative shrink-0">
          <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
          <div className="p-3 flex flex-col space-y-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/10 rounded-md border border-indigo-500/20 shrink-0">
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold mb-0.5">Contextual Action</p>
                <h3 className="text-xs font-bold text-zinc-100 truncate">
                  Trust: <span className="text-white">{activeTabDomain}</span>
                </h3>
              </div>
            </div>
            <button
              onClick={handleTrustActive}
              className="bg-indigo-600 hover:bg-indigo-500 text-white w-full py-2 rounded-md text-[10px] font-bold transition-colors flex justify-center items-center"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Trust {activeTabDomain}
            </button>
          </div>
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col flex-1 shrink-0">
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex flex-col space-y-2 relative">
          <form onSubmit={handleAdd} className="flex flex-col space-y-2">
            <div className="flex space-x-2">
              <div className="relative w-1/3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300 rounded p-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 flex items-center justify-between capitalize h-full"
                >
                  {ruleType.replace('_', ' ')}
                  <ChevronDown className="w-3 h-3 text-zinc-500" />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-md shadow-xl z-20 py-1 overflow-hidden">
                    {(['domain', 'wildcard', 'path', 'ip_range', 'regex'] as const).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => { setRuleType(type); setIsDropdownOpen(false); }}
                        className="w-full text-left px-2 py-1 text-[9px] text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100 capitalize font-medium transition-colors"
                      >
                        {type.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder={ruleType === 'domain' ? 'api.com' : ruleType === 'wildcard' ? '*.api.com' : ruleType === 'ip_range' ? '192.168.1.0/24' : ruleType === 'regex' ? '^https://.*' : 'api.com/v1/*'}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-1.5 text-[10px] font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 min-w-0"
              />
              <button 
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`p-1.5 rounded border transition-colors shrink-0 ${showAdvanced ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300'}`}
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </div>
            
            {showAdvanced && (
              <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-2 flex flex-col space-y-2 mt-1">
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Rule description or justification..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded p-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-medium text-zinc-500 w-12 shrink-0">Expiry:</span>
                  <select
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value as any)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-1 text-[9px] text-zinc-300 focus:outline-none focus:border-indigo-500 flex-1"
                  >
                    <option value="none">Never (Permanent)</option>
                    <option value="1h">1 Hour (Temporary JIT)</option>
                    <option value="24h">24 Hours (Session)</option>
                    <option value="7d">7 Days (Review)</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-medium text-zinc-500 w-12 shrink-0">Methods:</span>
                  <div className="flex flex-wrap gap-1">
                    {['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => toggleMethod(m)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors ${methods.includes(m) ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'bg-zinc-950 text-zinc-500 border-zinc-800 hover:border-zinc-700'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!newDomain.trim()}
              className="w-full bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-100 py-1.5 rounded text-[10px] font-bold transition-colors flex justify-center items-center"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add {showAdvanced ? 'Advanced' : ''} Rule
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar">
          <ul className="divide-y divide-zinc-800/50">
            {whitelist.map((entry) => (
              <li key={entry.id} className={`p-3 flex flex-col hover:bg-zinc-800/30 transition-colors relative ${entry.status === 'expired' ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 pr-6">
                    {entry.source === 'mdm' ? (
                      <div className="p-1.5 bg-zinc-800 rounded border border-zinc-700 shrink-0">
                        <Lock className="w-3 h-3 text-zinc-400" />
                      </div>
                    ) : (
                      <div className="p-1.5 bg-indigo-500/10 rounded border border-indigo-500/20 shrink-0">
                        <User className="w-3 h-3 text-indigo-400" />
                      </div>
                    )}
                    
                    <div className="min-w-0 flex flex-col items-start">
                      <p className="text-zinc-200 font-mono text-[11px] font-bold truncate block max-w-full">{entry.domain}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className={`text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${
                          entry.type === 'wildcard' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                          entry.type === 'path' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          entry.type === 'ip_range' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          entry.type === 'regex' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' :
                          'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                          {entry.type.replace('_', ' ')}
                        </span>
                        {entry.status === 'expired' && (
                          <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/20">
                            Expired
                          </span>
                        )}
                        {entry.status === 'active' && (
                          <span className="text-[8px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {entry.source === 'local' && (
                    <button
                      onClick={() => onRemove(entry.id)}
                      className="absolute top-3 right-3 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {entry.source === 'mdm' && (
                    <span className="absolute top-3 right-3 text-[8px] text-zinc-500 uppercase tracking-widest font-bold shrink-0">MDM</span>
                  )}
                </div>

                {entry.description && (
                  <p className="text-[10px] text-zinc-400 mt-1 mb-2 ml-[32px] flex items-center">
                    <Tag className="w-3 h-3 mr-1 text-zinc-500" />
                    {entry.description}
                  </p>
                )}

                {entry.conditions && (
                  <div className="flex flex-wrap gap-2 text-[9px] mt-1 mb-2 ml-[32px]">
                    {entry.conditions.methods && (
                      <span className="bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center">
                        <Activity className="w-2.5 h-2.5 mr-1" />
                        {entry.conditions.methods.join(', ')}
                      </span>
                    )}
                    {entry.conditions.ipRanges && (
                      <span className="bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center">
                        <Network className="w-2.5 h-2.5 mr-1" />
                        {entry.conditions.ipRanges.length} Subnets
                      </span>
                    )}
                    {entry.conditions.allowedUsers && (
                      <span className="bg-zinc-950 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800 flex items-center">
                        <Fingerprint className="w-2.5 h-2.5 mr-1" />
                        Identity Locked
                      </span>
                    )}
                    {entry.conditions.expiresAt && (
                      <span className={`px-1.5 py-0.5 rounded border flex items-center ${entry.status === 'expired' ? 'bg-red-950/30 text-red-400 border-red-900/50' : 'bg-zinc-950 text-zinc-400 border-zinc-800'}`}>
                        <Clock className="w-2.5 h-2.5 mr-1" />
                        {new Date(entry.conditions.expiresAt).toLocaleDateString()} {new Date(entry.conditions.expiresAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2 text-xs mt-1 ml-[32px]">
                  <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950 px-2 py-1 rounded border border-zinc-800 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={entry.bypasses.encryption} 
                      onChange={(e) => onUpdate(entry.id, { bypasses: { ...entry.bypasses, encryption: e.target.checked } })}
                      className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-zinc-900 w-3 h-3"
                      disabled={entry.source === 'mdm'}
                    />
                    <Shield className={`w-3 h-3 ${entry.bypasses.encryption ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span className={`text-[9px] font-medium ${entry.bypasses.encryption ? 'text-zinc-300' : 'text-zinc-500'}`}>Encrypt</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950 px-2 py-1 rounded border border-zinc-800 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={entry.bypasses.websockets} 
                      onChange={(e) => onUpdate(entry.id, { bypasses: { ...entry.bypasses, websockets: e.target.checked } })}
                      className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-zinc-900 w-3 h-3"
                      disabled={entry.source === 'mdm'}
                    />
                    <Radio className={`w-3 h-3 ${entry.bypasses.websockets ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span className={`text-[9px] font-medium ${entry.bypasses.websockets ? 'text-zinc-300' : 'text-zinc-500'}`}>WS</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer bg-zinc-950 px-2 py-1 rounded border border-zinc-800 shrink-0">
                    <input 
                      type="checkbox" 
                      checked={entry.bypasses.fileUploads} 
                      onChange={(e) => onUpdate(entry.id, { bypasses: { ...entry.bypasses, fileUploads: e.target.checked } })}
                      className="rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-zinc-900 w-3 h-3"
                      disabled={entry.source === 'mdm'}
                    />
                    <UploadCloud className={`w-3 h-3 ${entry.bypasses.fileUploads ? 'text-emerald-400' : 'text-zinc-600'}`} />
                    <span className={`text-[9px] font-medium ${entry.bypasses.fileUploads ? 'text-zinc-300' : 'text-zinc-500'}`}>Files</span>
                  </label>
                </div>
              </li>
            ))}
            {whitelist.length === 0 && (
              <li className="p-8 text-center text-zinc-500 flex flex-col items-center">
                <ShieldCheck className="w-8 h-8 text-zinc-700 mb-2" />
                <p className="text-[10px] font-medium">No active whitelist rules.</p>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
