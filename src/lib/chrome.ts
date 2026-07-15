import { InterceptLog, WhitelistEntry, Settings } from '../types';
import { mockLogs, mockWhitelist, mockSettings } from '../data';

const isExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

const listeners = new Set<Function>();

export const storage = {
  async get(keys: string | string[]): Promise<any> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get(keys, resolve);
      });
    }
    // Fallback for web preview
    const data: any = {};
    const keyArray = Array.isArray(keys) ? keys : [keys];
    if (keyArray.includes('logs')) data.logs = JSON.parse(localStorage.getItem('logs') || 'null') || mockLogs;
    if (keyArray.includes('whitelist')) data.whitelist = JSON.parse(localStorage.getItem('whitelist') || 'null') || mockWhitelist;
    if (keyArray.includes('settings')) data.settings = JSON.parse(localStorage.getItem('settings') || 'null') || mockSettings;
    return data;
  },
  async set(items: any): Promise<void> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.set(items, resolve);
      });
    }
    // Fallback for web preview
    if (items.logs) localStorage.setItem('logs', JSON.stringify(items.logs));
    if (items.whitelist) localStorage.setItem('whitelist', JSON.stringify(items.whitelist));
    if (items.settings) localStorage.setItem('settings', JSON.stringify(items.settings));
    
    // Trigger mock event in web preview
    if (items.whitelist) {
      listeners.forEach(l => l({ whitelist: { newValue: items.whitelist } }, 'local'));
    }
    if (items.settings) {
      listeners.forEach(l => l({ settings: { newValue: items.settings } }, 'local'));
    }
  },
  onChanged: {
    addListener(callback: (changes: any, areaName: string) => void) {
      if (isExtension) {
        chrome.storage.onChanged.addListener(callback);
      } else {
        listeners.add(callback);
      }
    },
    removeListener(callback: (changes: any, areaName: string) => void) {
      if (isExtension) {
        chrome.storage.onChanged.removeListener(callback);
      } else {
        listeners.delete(callback);
      }
    }
  }
};

