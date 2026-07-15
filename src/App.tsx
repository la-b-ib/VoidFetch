import React, { useState, useEffect } from 'react';
import { DashboardOverview } from './components/DashboardOverview';
import { LogsTable } from './components/LogsTable';
import { WhitelistManager } from './components/WhitelistManager';
import { SettingsPanel } from './components/SettingsPanel';
import { WhitelistEntry, Settings, InterceptLog } from './types';
import { mockLogs, mockWhitelist, mockSettings } from './data';
import { storage } from './lib/chrome';
import { LayoutDashboard, List, Shield, Settings as SettingsIcon } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [logs, setLogs] = useState<InterceptLog[]>(mockLogs);
  const [whitelist, setWhitelist] = useState<WhitelistEntry[]>(mockWhitelist);
  const [settings, setSettings] = useState<Settings>(mockSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial data
    const loadData = async () => {
      try {
        const data = await storage.get(['logs', 'whitelist', 'settings']);
        if (data.logs) setLogs(data.logs);
        if (data.whitelist) setWhitelist(data.whitelist);
        if (data.settings) setSettings(data.settings);
      } catch (err) {
        console.error("Failed to load extension data", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    // Listen for storage changes
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === 'local') {
        if (changes.logs) setLogs(changes.logs.newValue || []);
        if (changes.whitelist) setWhitelist(changes.whitelist.newValue || []);
        if (changes.settings) setSettings(changes.settings.newValue || mockSettings);
      }
    };
    
    storage.onChanged.addListener(handleStorageChange);
    return () => storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const handleAddWhitelist = async (entryData: Pick<WhitelistEntry, 'domain' | 'type' | 'bypasses'>) => {
    const newEntry: WhitelistEntry = {
      id: Math.random().toString(36).substr(2, 9),
      ...entryData,
      addedBy: 'admin',
      addedAt: new Date().toISOString(),
      source: 'local'
    };
    const newWhitelist = [newEntry, ...whitelist];
    setWhitelist(newWhitelist);
    await storage.set({ whitelist: newWhitelist });
  };

  const handleUpdateWhitelist = async (id: string, updates: Partial<WhitelistEntry>) => {
    const newWhitelist = whitelist.map(w => w.id === id ? { ...w, ...updates } : w);
    setWhitelist(newWhitelist);
    await storage.set({ whitelist: newWhitelist });
  };

  const handleRemoveWhitelist = async (id: string) => {
    const newWhitelist = whitelist.filter(w => w.id !== id);
    setWhitelist(newWhitelist);
    await storage.set({ whitelist: newWhitelist });
  };

  const handleSaveSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    await storage.set({ settings: newSettings });
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full text-zinc-400">Loading...</div>;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardOverview logs={logs} />;
      case 'logs':
        return <LogsTable logs={logs} />;
      case 'whitelist':
        return <WhitelistManager 
          whitelist={whitelist} 
          onAdd={handleAddWhitelist} 
          onRemove={handleRemoveWhitelist}
          onUpdate={handleUpdateWhitelist}
        />;
      case 'settings':
        return <SettingsPanel 
          settings={settings} 
          onSave={handleSaveSettings} 
        />;
      default:
        return <DashboardOverview logs={logs} />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dash' },
    { id: 'logs', icon: List, label: 'Logs' },
    { id: 'whitelist', icon: Shield, label: 'Rules' },
    { id: 'settings', icon: SettingsIcon, label: 'Opts' }
  ];

  return (
    <div className="flex h-screen w-full max-w-[100vw] flex-col overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      <header className="shrink-0 h-[45px] flex items-center justify-between px-3 border-b border-zinc-800 bg-zinc-900/50 z-10">
        <h1 className="text-sm font-semibold text-zinc-100 truncate w-full pr-2">
          {activeTab === 'logs' ? 'Intercept Logs' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h1>
        <div className="shrink-0 flex items-center space-x-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-dotted border-emerald-400/20">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full  shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
          <span className="text-[10px] font-bold tracking-wider uppercase">Live</span>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto hide-scrollbar overflow-x-hidden p-3 bg-zinc-950">
        <div className="w-full space-y-4">
          {renderContent()}
        </div>
      </main>

      <nav className="shrink-0 h-[50px] bg-zinc-900 border-t border-zinc-800 flex justify-around items-center px-2 pb-safe">
        {navItems.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center justify-center w-16 h-full transition-colors ${
              activeTab === id ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon className="w-5 h-5" />
          </button>
        ))}
      </nav>
    </div>
  );
}
