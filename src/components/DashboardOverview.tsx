import React, { useState, useEffect } from 'react';
import { InterceptLog } from '../types';
import { Shield, AlertTriangle, CheckCircle, FileKey, X, Activity, Clock, Globe, Server, Terminal, Network, Search, Cpu } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, BarChart, Bar, Cell, Tooltip } from 'recharts';

interface Props {
  logs: InterceptLog[];
}

interface TargetInfo {
  ip: string;
  server: string;
  xPoweredBy: string;
  securityHeaders: string[];
  isLoading: boolean;
}

export function DashboardOverview({ logs }: Props) {
  const [selectedLog, setSelectedLog] = useState<InterceptLog | null>(null);
  const [timeFilter, setTimeFilter] = useState('1 Hour');
  const [activeTab, setActiveTab] = useState<chrome.tabs.Tab | null>(null);
  const [targetInfo, setTargetInfo] = useState<TargetInfo | null>(null);

  useEffect(() => {
    if (activeTab?.url && activeTab.url.startsWith('http')) {
      const fetchReconInfo = async () => {
        try {
          const urlObj = new URL(activeTab.url!);
          const hostname = urlObj.hostname;
          setTargetInfo({ ip: 'Resolving...', server: 'Detecting...', xPoweredBy: 'Detecting...', securityHeaders: [], isLoading: true });
          
          let ip = 'Unknown';
          try {
            const dnsResponse = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
            const dnsData = await dnsResponse.json();
            ip = dnsData.Answer?.find((a: any) => a.type === 1)?.data || 'Unknown IP';
          } catch(e) {}
          
          let server = 'Unknown';
          let xPoweredBy = 'Hidden';
          let securityHeaders: string[] = [];
          
          try {
            const headResponse = await fetch(activeTab.url!, { method: 'HEAD', cache: 'no-cache' });
            server = headResponse.headers.get('server') || 'Hidden';
            xPoweredBy = headResponse.headers.get('x-powered-by') || 'Hidden';
            
            const secHeadersList = ['strict-transport-security', 'content-security-policy', 'x-frame-options', 'x-content-type-options'];
            secHeadersList.forEach(h => {
              if (headResponse.headers.has(h)) securityHeaders.push(h);
            });
          } catch (e) {
            server = 'Protected / CORS Blocked';
          }
          
          setTargetInfo({ ip, server, xPoweredBy, securityHeaders, isLoading: false });
        } catch(e) {
          console.error(e);
        }
      };
      
      fetchReconInfo();
    } else {
      setTargetInfo(null);
    }
  }, [activeTab?.url]);

  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      const updateActiveTab = () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            setActiveTab(tabs[0]);
          }
        });
      };
      
      updateActiveTab();
      
      const handleTabUpdate = (tabId: number, changeInfo: any, tab: chrome.tabs.Tab) => {
        if (tab.active) updateActiveTab();
      };
      
      chrome.tabs.onActivated.addListener(updateActiveTab);
      chrome.tabs.onUpdated.addListener(handleTabUpdate);

      return () => {
        chrome.tabs.onActivated.removeListener(updateActiveTab);
        chrome.tabs.onUpdated.removeListener(handleTabUpdate);
      };
    }
  }, []);

  const stats = {
    total: logs.length,
    blocked: logs.filter(l => ['blocked', 'clipboard_blocked', 'websocket_intercepted', 'file_upload_blocked', 'tamper_attempt', 'credential_reuse_blocked'].includes(l.action)).length,
    encrypted: logs.filter(l => l.action === 'encrypted').length,
    justified: logs.filter(l => l.action === 'jit_justified').length,
    allowed: logs.filter(l => l.action === 'allowed' || l.action === 'oauth_tracked').length,
  };

  const getActionColor = (action: string) => {
    if (action.includes('block') || action.includes('tamper')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (action === 'encrypted') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action === 'jit_justified') return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    return 'text-zinc-400 bg-zinc-800 border-zinc-700';
  };

  const recentActivity = logs.slice(0, 15).map((log) => {
    const finalSize = log.payloadSize || 0;
    return {
      time: new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      size: finalSize
    };
  }).reverse();

  // Dynamic Egress Vectors
  const exfilDocs = logs.filter(l => /\.(csv|pdf|xls|xlsx|doc|docx)/i.test(l.url || '') || l.originalPayload?.match(/\.(csv|pdf|xls|xlsx|doc|docx)/i)).length;
  const exfilSecrets = logs.filter(l => /\.(env|pem|key|rsa)/i.test(l.url || '') || l.originalPayload?.match(/\.(env|pem|key|rsa)/i) || l.originalPayload?.includes('BEGIN RSA PRIVATE KEY')).length;
  const exfilDumps = logs.filter(l => /\.(sql|dmp|bak|json\.gz)/i.test(l.url || '') || l.originalPayload?.match(/\.(sql|dmp|bak|json\.gz)/i)).length;
  const exfilBase64 = logs.filter(l => l.originalPayload?.match(/base64/i) || l.url?.match(/b64|base64/i)).length;

  
  // Dynamic Credential Shield
  const credentialShieldCount = logs.filter(l => l.action === 'credential_reuse_blocked' || l.sensitiveFieldsDetected?.includes('Secrets')).length;
  
  // Dynamic Tamper Prevent
  const tamperCount = logs.filter(l => l.action === 'tamper_attempt').length;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const COLORS = ['#818cf8', '#facc15', '#f43f5e', '#34d399', '#a78bfa'];
  
  const classifiedCounts: Record<string, number> = {};
  logs.forEach(log => {
    if (log.sensitiveFieldsDetected && log.sensitiveFieldsDetected.length > 0) {
      log.sensitiveFieldsDetected.forEach(field => {
        classifiedCounts[field] = (classifiedCounts[field] || 0) + 1;
      });
    }
  });
  
  const classifiedData = Object.entries(classifiedCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (classifiedData.length === 0) {
    classifiedData.push({ name: 'No Data', value: 0 });
  }

  // Dynamic SaaS Tenants
  const topDomainsMap: Record<string, number> = {};
  logs.forEach(log => {
    try {
      const url = new URL(log.url);
      const domain = url.hostname;
      topDomainsMap[domain] = (topDomainsMap[domain] || 0) + 1;
    } catch {
      topDomainsMap[log.url] = (topDomainsMap[log.url] || 0) + 1;
    }
  });

  const saasTenantsCount = Object.keys(topDomainsMap).length;

  const topDomains = Object.entries(topDomainsMap)
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count);

  // A simple 3D Bar Shape
  const getPath = (x: number, y: number, width: number, height: number) => {
    const depth = 6;
    return `M${x},${y + height}
            L${x + width},${y + height}
            L${x + width},${y}
            L${x},${y}
            Z
            M${x + width},${y}
            L${x + width + depth},${y - depth}
            L${x + width + depth},${y + height - depth}
            L${x + width},${y + height}
            Z
            M${x},${y}
            L${x + depth},${y - depth}
            L${x + width + depth},${y - depth}
            L${x + width},${y}
            Z`;
  };

  const TriangleBar = (props: any) => {
    const { fill, x, y, width, height } = props;
    if (height === 0 || isNaN(height)) return null;
    return <path d={getPath(x, y, width, height)} stroke="rgba(0,0,0,0.2)" strokeWidth={0.5} fill={fill} />;
  };

  const healthScore = Math.max(0, 100 - Math.round(((stats.blocked + tamperCount) / (stats.total || 1)) * 100));
  const healthColor = healthScore > 80 ? 'text-emerald-400' : (healthScore > 50 ? 'text-amber-400' : 'text-rose-400');

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 truncate">
          <div className="bg-emerald-500/10 border border-emerald-500/20 w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            {activeTab && activeTab.favIconUrl ? (
              <img src={activeTab.favIconUrl} alt="favicon" className="w-6 h-6 rounded" />
            ) : (
              <Globe className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div className="truncate">
            <h2 className="text-sm font-bold text-zinc-100 truncate">{activeTab?.title || 'Executive Summary'}</h2>
            <p className="text-xs text-zinc-400 truncate">
              {activeTab?.url ? (
                <span className="font-mono text-[10px]">{new URL(activeTab.url).hostname}</span>
              ) : (
                <>Health: <span className={`${healthColor} font-medium`}>{healthScore}/100</span></>
              )}
            </p>
          </div>
        </div>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 px-2 py-1.5 rounded-md flex items-center text-[9px] font-bold uppercase tracking-wider transition-colors shrink-0">
          <FileKey className="w-3 h-3 mr-1" />
          Export
        </button>
      </div>

      
      {/* Live Target Reconnaissance */}
      {targetInfo && activeTab?.url && (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg mb-4 animate-in fade-in duration-500">
          <div className="flex items-center space-x-2 mb-3">
            <Search className="w-4 h-4 text-indigo-400" />
            <h3 className="font-bold text-[10px] text-zinc-100 uppercase tracking-wider">Live Target Profiling</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start space-x-2">
              <Network className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Resolved IP Address</p>
                <p className="text-[10px] text-zinc-200 font-mono font-medium">
                  {targetInfo.isLoading ? <span className="">resolving...</span> : targetInfo.ip}
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Server className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mb-0.5">Server Identity</p>
                <p className="text-[10px] text-zinc-200 font-mono font-medium truncate">
                  {targetInfo.isLoading ? <span className="">probing...</span> : targetInfo.server}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 col-span-2">
              <Cpu className="w-3 h-3 text-amber-400 mt-0.5 shrink-0" />
              <div className="w-full">
                <p className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Security Posture</p>
                <div className="flex flex-wrap gap-1">
                  {targetInfo.xPoweredBy !== 'Hidden' && (
                    <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono">
                      {targetInfo.xPoweredBy}
                    </span>
                  )}
                  {targetInfo.securityHeaders.map(h => (
                    <span key={h} className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
                      {h}
                    </span>
                  ))}
                  {!targetInfo.isLoading && targetInfo.xPoweredBy === 'Hidden' && targetInfo.securityHeaders.length === 0 && (
                    <span className="text-[8px] text-zinc-500 font-mono italic">No revealing headers</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col relative overflow-hidden">
          <AlertTriangle className="w-8 h-8 text-rose-500/20 absolute -bottom-1 -right-1" />
          <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider truncate">Prevented</p>
          <h3 className="text-lg font-bold text-zinc-100 mt-0.5">{stats.blocked}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col relative overflow-hidden">
          <Shield className="w-8 h-8 text-emerald-500/20 absolute -bottom-1 -right-1" />
          <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider truncate">Encrypted</p>
          <h3 className="text-lg font-bold text-zinc-100 mt-0.5">{stats.encrypted}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col relative overflow-hidden">
          <FileKey className="w-8 h-8 text-indigo-500/20 absolute -bottom-1 -right-1" />
          <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider truncate">Justified</p>
          <h3 className="text-lg font-bold text-zinc-100 mt-0.5">{stats.justified}</h3>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col relative overflow-hidden">
          <CheckCircle className="w-8 h-8 text-zinc-500/20 absolute -bottom-1 -right-1" />
          <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider truncate">Allowed</p>
          <h3 className="text-lg font-bold text-zinc-100 mt-0.5">{stats.allowed}</h3>
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-[10px] text-zinc-100 uppercase tracking-wider">Payload Volume</h3>
            <select 
              className="bg-zinc-950 border border-zinc-800 text-zinc-400 text-[9px] py-0.5 px-1 rounded focus:outline-none focus:border-indigo-500 cursor-pointer"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option>15 Mins</option>
              <option>1 Hour</option>
              <option>24 Hours</option>
            </select>
          </div>
          <div className="h-[60px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={recentActivity} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="size" stroke="#818cf8" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSize)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 flex flex-col items-center">
            <h3 className="font-bold text-[10px] text-zinc-100 uppercase tracking-wider w-full mb-1 text-center">Classified Data</h3>
            <div className="h-[60px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classifiedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <Bar dataKey="value" shape={<TriangleBar />}>
                    {classifiedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col w-full space-y-0.5 mt-1 overflow-y-auto hide-scrollbar max-h-[40px]">
              {classifiedData.map((entry, index) => (
                <div key={entry.name} className="flex justify-between items-center text-[8px]">
                  <div className="flex items-center">
                    <div className="w-1.5 h-1.5 rounded-full mr-1 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-zinc-400 truncate max-w-[50px]">{entry.name}</span>
                  </div>
                  <span className="text-zinc-200 ml-1">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col">
            <h3 className="font-bold text-[10px] text-zinc-100 uppercase tracking-wider mb-2 text-center">Top Endpoints</h3>
            <div className="flex-1 space-y-1.5 overflow-hidden">
              {topDomains.slice(0, 4).map(item => (
                <div key={item.domain} className="w-full">
                  <div className="flex justify-between text-[8px] mb-0.5">
                    <span className="text-zinc-300 truncate w-[70%]">{item.domain}</span>
                    <span className="text-zinc-500">{item.count}</span>
                  </div>
                  <div className="w-full bg-zinc-800/50 rounded-full h-1">
                    <div className="bg-rose-500 h-1 rounded-full" style={{ width: `${(item.count / 42) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b border-zinc-800 bg-zinc-950/50 flex justify-between items-center">
          <h3 className="font-bold text-xs text-zinc-100 flex items-center">
            <Clock className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
            Live Ticker
          </h3>
          <span className="flex items-center text-[10px] font-medium text-emerald-400">
             <span className="relative flex h-1.5 w-1.5 mr-1.5">
               <span className=" absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
               <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
             </span>
             Active
          </span>
        </div>
        <div className="p-0 overflow-y-auto hide-scrollbar max-h-[180px]">
          {logs.slice(0, 10).map((log, i) => (
            <div 
              key={log.id} 
              onClick={() => setSelectedLog(log)}
              className={`p-2 border-b border-zinc-800/50 flex items-center text-xs cursor-pointer hover:bg-zinc-800 transition-colors ${i % 2 === 0 ? 'bg-zinc-900' : 'bg-zinc-900/50'}`}
            >
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider shrink-0 mr-2 ${getActionColor(log.action)}`}>
                {log.action.replace(/_/g, ' ').split(' ')[0]}
              </span>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-zinc-300 truncate font-mono text-[10px] block w-full">{log.url}</span>
                <span className="text-zinc-500 font-mono text-[9px]">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-4 text-center text-zinc-500 text-xs">No incidents captured.</div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
           <h4 className="font-bold text-[10px] text-zinc-100 uppercase tracking-wider mb-2">Egress Vector Analysis</h4>
           <div className="space-y-1.5">
             <div className="flex justify-between text-[9px]">
                <span className="text-zinc-400 font-mono">Documents (.csv, .pdf)</span>
                <span className="text-zinc-200">{exfilDocs} events</span>
             </div>
             <div className="w-full bg-zinc-800/50 rounded-full h-1"><div className="bg-blue-500 h-1 rounded-full" style={{width: `${Math.min((exfilDocs/20)*100, 100)}%`}}></div></div>
             
             <div className="flex justify-between text-[9px] pt-0.5">
                <span className="text-zinc-400 font-mono">Secrets (.env, .pem)</span>
                <span className="text-zinc-200">{exfilSecrets} events</span>
             </div>
             <div className="w-full bg-zinc-800/50 rounded-full h-1"><div className="bg-rose-500 h-1 rounded-full" style={{width: `${Math.min((exfilSecrets/10)*100, 100)}%`}}></div></div>

             <div className="flex justify-between text-[9px] pt-0.5">
                <span className="text-zinc-400 font-mono">Data Dumps (.sql, .dmp)</span>
                <span className="text-zinc-200">{exfilDumps} events</span>
             </div>
             <div className="w-full bg-zinc-800/50 rounded-full h-1"><div className="bg-amber-500 h-1 rounded-full" style={{width: `${Math.min((exfilDumps/10)*100, 100)}%`}}></div></div>

             <div className="flex justify-between text-[9px] pt-0.5">
                <span className="text-zinc-400 font-mono">B64 Obfuscation</span>
                <span className="text-zinc-200">{exfilBase64} events</span>
             </div>
             <div className="w-full bg-zinc-800/50 rounded-full h-1"><div className="bg-purple-500 h-1 rounded-full" style={{width: `${Math.min((exfilBase64/10)*100, 100)}%`}}></div></div>
           </div>
        </div>

        <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-rose-400" />
            <div>
              <h4 className="font-bold text-[10px] text-rose-400 uppercase tracking-wider">Credential Shield</h4>
              <p className="text-[9px] text-rose-400/80">Corporate password reuse prevented</p>
            </div>
          </div>
          <span className="text-lg font-bold text-rose-400">{credentialShieldCount}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col">
            <h4 className="font-semibold text-zinc-300 text-[10px]">SaaS Tenants</h4>
            <span className="text-sm font-bold text-zinc-100 mt-auto">{saasTenantsCount}</span>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 p-2 rounded-lg flex flex-col">
            <h4 className="font-semibold text-zinc-300 text-[10px]">Tamper Prevent</h4>
            <span className="text-sm font-bold text-zinc-100 mt-auto">{tamperCount}</span>
          </div>
        </div>
      </div>

      {/* Drill Down Modal for Side Panel */}
      {selectedLog && (
        <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-900">
            <h3 className="font-bold text-sm text-zinc-100 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-rose-500" />
              Forensics
            </h3>
            <button 
              onClick={() => setSelectedLog(null)}
              className="text-zinc-500 hover:text-zinc-300 p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar p-3 space-y-4 pb-16">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Time</p>
              <p className="text-xs text-zinc-200 font-mono">
                {new Date(selectedLog.timestamp).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Action</p>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${getActionColor(selectedLog.action)}`}>
                {selectedLog.action.replace(/_/g, ' ')}
              </span>
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Context</p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">EMP:</span>
                  <span className="text-[10px] text-zinc-300 font-mono">EMP-94021-ALFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-zinc-500">DEV:</span>
                  <span className="text-[10px] text-zinc-300 font-mono">MBP-X21-994</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Endpoint</p>
              <p className="text-[10px] text-zinc-200 font-mono break-all bg-zinc-900 p-2 rounded-md border border-zinc-800 w-full block">
                {selectedLog.url}
              </p>
            </div>

            {selectedLog.details && (
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Policy</p>
                <p className="text-[10px] text-rose-400 bg-rose-500/10 p-2 rounded-md border border-rose-500/20 font-medium">
                  {selectedLog.details}
                </p>
              </div>
            )}

            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold mb-1">Payload</p>
              <div className="bg-zinc-950 border border-zinc-800 rounded-md p-2 relative overflow-hidden">
                <div className="font-mono text-[9px] text-zinc-400 whitespace-pre-wrap break-all leading-tight">
                  {`POST /api/v1/messages HTTP/2\nHost: ${(() => { try { return new URL(selectedLog.url).hostname; } catch(e) { return selectedLog.url || 'api.openai.com'; } })()}\n\n{"role":"user","content":"AWS_ACCESS_KEY_ID='AKIA***'"}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

