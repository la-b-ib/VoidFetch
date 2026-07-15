import React from 'react';
import { LayoutDashboard, Shield, List, Settings as SettingsIcon, ShieldAlert } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'logs', label: 'Intercept Logs', icon: List },
    { id: 'whitelist', label: 'Whitelist', icon: Shield },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
      <div className="py-6 pr-6 pl-[10px] ml-[1px] flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center shadow-lg">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold tracking-tight text-xl text-zinc-100">VoidFetch</span>
      </div>
      
      <nav className="flex-1 px-0 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors focus:outline-none text-sm ${
                isActive
                  ? 'bg-indigo-600/10 text-indigo-400'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </nav>

    </aside>
  );
}
