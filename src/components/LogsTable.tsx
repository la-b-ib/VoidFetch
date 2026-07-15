import React, { useState, useMemo } from 'react';
import { InterceptLog, ActionType } from '../types';
import { Shield, ShieldAlert, ShieldCheck, FileCheck, CopyX, Key, Activity, UploadCloud, MonitorX, KeyRound, Search, Calendar, CheckSquare, Square, ChevronDown, ChevronRight, X, Download, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

interface Props {
  logs: InterceptLog[];
}

export function LogsTable({ logs }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState<ActionType | 'all'>('all');
  
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Aggregation for Area Chart
  const timeSeriesData = useMemo(() => {
    if (!logs.length) return [];
    
    // Group by hour
    const countsByHour: Record<string, { time: string; blocked: number; encrypted: number; allowed: number }> = {};
    
    logs.forEach(log => {
      const d = new Date(log.timestamp);
      // simplify to day-hour
      const key = `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:00`;
      if (!countsByHour[key]) {
        countsByHour[key] = { time: key, blocked: 0, encrypted: 0, allowed: 0 };
      }
      
      if (log.action === 'blocked' || log.action === 'file_upload_blocked' || log.action === 'clipboard_blocked' || log.action === 'credential_reuse_blocked') {
        countsByHour[key].blocked += 1;
      } else if (log.action === 'encrypted') {
        countsByHour[key].encrypted += 1;
      } else {
        countsByHour[key].allowed += 1;
      }
    });

    return Object.values(countsByHour).reverse(); // assuming logs are sorted newest first, we want oldest first
  }, [logs]);

  // Aggregation for Pie Chart
  const actionData = useMemo(() => {
    if (!logs.length) return [];
    const counts: Record<string, number> = {};
    logs.forEach(log => {
      counts[log.action] = (counts[log.action] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
  }, [logs]);

  const PIE_COLORS = ['#f43f5e', '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#64748b'];

  const getActionBadge = (action: ActionType) => {
    switch (action) {
      case 'encrypted': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-emerald-400/10 text-emerald-400 border border-emerald-400/20">Encrypted</span>;
      case 'blocked': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-rose-400/10 text-rose-400 border border-rose-400/20">Blocked</span>;
      case 'allowed': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-zinc-400/10 text-zinc-400 border border-zinc-400/20">Allowed</span>;
      case 'jit_justified': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-indigo-400/10 text-indigo-400 border border-indigo-400/20">JIT Justified</span>;
      case 'clipboard_blocked': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-amber-400/10 text-amber-400 border border-amber-400/20">Clipboard</span>;
      case 'oauth_tracked': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-blue-400/10 text-blue-400 border border-blue-400/20">OAuth</span>;
      case 'websocket_intercepted': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-purple-400/10 text-purple-400 border border-purple-400/20">WebSocket</span>;
      case 'file_upload_blocked': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-orange-400/10 text-orange-400 border border-orange-400/20">Upload</span>;
      case 'tamper_attempt': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-red-500/10 text-red-500 border border-red-500/20">Tamper</span>;
      case 'credential_reuse_blocked': return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider bg-pink-400/10 text-pink-400 border border-pink-400/20">Cred Reuse</span>;
      default: return null;
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch (severity) {
      case 'low': return <span className="inline-flex items-center text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-blue-900/50">Low</span>;
      case 'medium': return <span className="inline-flex items-center text-amber-400 bg-amber-950/50 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-amber-900/50">Med</span>;
      case 'high': return <span className="inline-flex items-center text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-red-900/50">High</span>;
      case 'critical': return <span className="inline-flex items-center text-rose-500 bg-rose-950 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-rose-900 shadow-[0_0_8px_rgba(244,63,94,0.1)]">Crit</span>;
      default: return <span className="inline-flex items-center text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-zinc-700/50">Info</span>;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        searchQuery === '' || 
        log.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userIdentity?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchType = eventTypeFilter === 'all' || log.action === eventTypeFilter;

      return matchSearch && matchType;
    });
  }, [logs, searchQuery, eventTypeFilter]);

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(selectedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedRows(newSet);
  };

  const toggleExpandRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full space-y-2 pb-4">
      
      {/* Charts Section */}
      <div className="flex space-x-2 shrink-0">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex-1 flex flex-col h-32 relative overflow-hidden group">
          <div className="absolute top-2 left-3 z-10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Event Volume (48h)</div>
          
          {/* Subtle grid background to enhance 3D feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [transform:perspective(500px)_rotateX(60deg)] opacity-30 origin-bottom"></div>

          <div className="flex-1 w-full h-full mt-2 relative z-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 0, left: 0, bottom: -10 }}>
                <defs>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorEncrypted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAllowed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <filter id="shadow3d" height="200%" width="200%" x="-20%" y="-20%">
                    <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#000000" floodOpacity="0.6"/>
                    <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.4"/>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" strokeOpacity={0.4} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', fontSize: '10px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#e4e4e7' }}
                  cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '3 3' }}
                />
                <Area type="monotone" dataKey="allowed" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAllowed)" strokeWidth={2.5} filter="url(#shadow3d)" />
                <Area type="monotone" dataKey="encrypted" stroke="#10b981" fillOpacity={1} fill="url(#colorEncrypted)" strokeWidth={2.5} filter="url(#shadow3d)" />
                <Area type="monotone" dataKey="blocked" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBlocked)" strokeWidth={3} filter="url(#shadow3d)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 w-1/3 flex flex-col h-32 relative overflow-hidden group">
          <div className="absolute top-2 left-3 z-10 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Action Types</div>
          
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent opacity-50"></div>
          
          <div className="flex-1 w-full h-full mt-2 relative z-0 flex items-center justify-center">
            <div className="absolute w-20 h-20 rounded-full border border-zinc-800/50 [transform:rotateX(60deg)] border-b-zinc-700/50 mt-4 pointer-events-none"></div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  <filter id="pieShadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#000000" floodOpacity="0.7"/>
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.5"/>
                  </filter>
                </defs>
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '6px', fontSize: '10px', padding: '4px 8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                  itemStyle={{ color: '#e4e4e7' }}
                />
                <Pie
                  data={actionData}
                  innerRadius={22}
                  outerRadius={38}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                  cornerRadius={4}
                >
                  {actionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ filter: 'url(#pieShadow)' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 flex flex-col space-y-2 shrink-0">
        <div className="flex space-x-2 w-full">
          <div className="relative flex-1">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-1/2 transform -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-200 placeholder-zinc-500 rounded py-1 pl-6 pr-2 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors block truncate"
            />
          </div>
          <button className="bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 px-2 py-1 rounded flex items-center justify-center transition-colors shrink-0">
            <Download className="w-3 h-3" />
          </button>
        </div>
        
        <div className="flex space-x-2">
          <div className="relative flex-[2]">
            <select 
              value={eventTypeFilter} 
              onChange={(e) => setEventTypeFilter(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-300 rounded py-1 pl-1.5 pr-4 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="blocked">Blocked</option>
              <option value="encrypted">Encrypted</option>
              <option value="jit_justified">Justified</option>
              <option value="tamper_attempt">Tamper</option>
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
          
          <div className="relative flex-[1]">
            <select className="w-full bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-300 rounded py-1 pl-1.5 pr-4 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
              <option value="all">Mthd</option>
              <option value="POST">POST</option>
              <option value="GET">GET</option>
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative flex-[1]">
            <select className="w-full bg-zinc-950 border border-zinc-800 text-[9px] text-zinc-300 rounded py-1 pl-1.5 pr-4 focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer">
              <option value="all">Sev</option>
              <option value="high">High</option>
              <option value="medium">Med</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-1.5 top-1/2 transform -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-800">
          <button 
            onClick={() => {
              if (selectedRows.size === filteredLogs.length && filteredLogs.length > 0) {
                setSelectedRows(new Set());
              } else {
                setSelectedRows(new Set(filteredLogs.map(l => l.id)));
              }
            }}
            className="flex items-center text-[9px] text-zinc-400 hover:text-zinc-200"
          >
            {selectedRows.size === filteredLogs.length && filteredLogs.length > 0 ? (
              <CheckSquare className="w-3 h-3 mr-1 text-indigo-400" />
            ) : (
              <Square className="w-3 h-3 mr-1" />
            )}
            Select All
          </button>
          
          <div className="flex items-center text-[9px] text-zinc-500 bg-zinc-950/50 px-1.5 py-0.5 rounded border border-zinc-800/50">
            <Calendar className="w-2.5 h-2.5 mr-1" />
            Oct 1 - Oct 7
          </div>
        </div>
      </div>
      
      {/* Floating Action Bar */}
      {selectedRows.size > 0 && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-11/12 max-w-[340px] bg-zinc-800 border border-zinc-700 shadow-2xl rounded-full px-3 py-1.5 flex justify-between items-center z-50 animate-in slide-in-from-top-4 fade-in duration-200">
          <span className="text-[9px] font-bold text-zinc-100 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30 shrink-0">
            {selectedRows.size} sel
          </span>
          <div className="flex space-x-2">
            <button className="text-[9px] font-bold text-zinc-300 hover:text-white flex items-center transition-colors">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> Trust
            </button>
            <div className="h-3 w-px bg-zinc-700 mx-0.5"></div>
            <button className="text-[9px] font-bold text-zinc-300 hover:text-white flex items-center transition-colors">
              <Download className="w-3 h-3 mr-1 text-blue-400" /> CSV
            </button>
            <div className="h-3 w-px bg-zinc-700 mx-0.5"></div>
            <button onClick={() => setSelectedRows(new Set())} className="text-zinc-400 hover:text-white p-0.5">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
      
      {/* Accordion Cards */}
      <div className="flex-1 overflow-y-auto hide-scrollbar space-y-2">
        {filteredLogs.map((log) => {
          const isExpanded = expandedRow === log.id;
          const isSelected = selectedRows.has(log.id);

          return (
            <div 
              key={log.id}
              className={`bg-zinc-900 border ${isSelected ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-zinc-800'} rounded-lg overflow-hidden flex flex-col transition-colors`}
            >
              <div 
                className="p-2.5 flex items-start space-x-2 cursor-pointer"
                onClick={() => toggleExpandRow(log.id)}
              >
                <button onClick={(e) => toggleSelectRow(log.id, e)} className="text-zinc-500 hover:text-zinc-300 focus:outline-none shrink-0 mt-0.5">
                  {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-indigo-400" /> : <Square className="w-3.5 h-3.5" />}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-zinc-500 font-mono text-[9px]">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <div className="flex space-x-1 shrink-0">
                      {getSeverityBadge(log.severity)}
                      {getActionBadge(log.action)}
                    </div>
                  </div>
                  <div className="text-zinc-300 font-mono text-[10px] truncate w-full block">
                    <span className="text-zinc-500 mr-1">{log.method}</span>
                    {log.url}
                  </div>
                </div>
                
                <div className="shrink-0 text-zinc-500 mt-1">
                  {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>
              
              {isExpanded && (
                <div className="p-2.5 pt-0 bg-zinc-950/30 border-t border-zinc-800/50">
                  <div className="mt-2 space-y-2">
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Identity</span>
                      <span className="text-zinc-300 font-mono text-[10px] truncate block w-full">{log.userIdentity}</span>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Rule</span>
                      <span className="text-zinc-300 text-[10px] truncate block w-full">{log.policyRule}</span>
                    </div>

                    {log.sensitiveFieldsDetected && log.sensitiveFieldsDetected.length > 0 && (
                      <div className="flex flex-col">
                        <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-0.5">Triggers</span>
                        <span className="text-rose-400 text-[10px] truncate block w-full">{log.sensitiveFieldsDetected.join(', ')}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col bg-zinc-950 border border-zinc-800 rounded p-1.5 relative">
                       <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-wider mb-1">Raw Payload</span>
                       <pre className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap leading-tight break-all">
                         {log.originalPayload || 'No payload recorded.'}
                       </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredLogs.length === 0 && (
          <div className="flex flex-col items-center justify-center h-24 text-zinc-500 space-y-2">
            <CheckCircle2 className="w-6 h-6 text-zinc-700" />
            <p className="text-[10px] font-medium">No intercept logs found.</p>
          </div>
        )}
      </div>

      {/* Pagination (Mock) */}
      {filteredLogs.length > 0 && (
        <div className="flex items-center justify-between border-t border-zinc-800 pt-2 shrink-0">
          <span className="text-[9px] text-zinc-500 font-medium">
            1-10 of {filteredLogs.length}
          </span>
          <div className="flex items-center space-x-1">
            <button className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-1 rounded hover:bg-zinc-800 focus:outline-none transition-colors">
              <ChevronDown className="w-3 h-3 transform rotate-90" />
            </button>
            <button className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-1 rounded hover:bg-zinc-800 focus:outline-none transition-colors">
              <ChevronDown className="w-3 h-3 transform -rotate-90" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
