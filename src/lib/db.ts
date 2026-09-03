import { Client, AppData } from './types';

const STORAGE_KEY = 'pisomate_data';
const CURRENT_VERSION = 2;

export const db = {
  getData: (): AppData => {
    if (typeof window === 'undefined') return { clients: [], version: CURRENT_VERSION };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: [], version: CURRENT_VERSION };
    try {
      const data = JSON.parse(raw);
      // Basic migration/repair logic could go here if version changes
      return data;
    } catch (e) {
      console.error('Failed to parse storage', e);
      return { clients: [], version: CURRENT_VERSION };
    }
  },

  saveData: (data: AppData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, version: CURRENT_VERSION }));
  },

  addClient: (client: Client) => {
    const data = db.getData();
    data.clients.unshift(client);
    db.saveData(data);
  },

  updateClient: (client: Client) => {
    const data = db.getData();
    const index = data.clients.findIndex((c) => c.id === client.id);
    if (index !== -1) {
      data.clients[index] = client;
      db.saveData(data);
    }
  },

  deleteClient: (clientId: string) => {
    const data = db.getData();
    data.clients = data.clients.filter((c) => c.id !== clientId);
    db.saveData(data);
  },

  clearAllData: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },

  exportData: () => {
    const data = db.getData();
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      appName: 'PisoMate'
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pisomate_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  importData: async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data && Array.isArray(data.clients)) {
        db.saveData({ clients: data.clients, settings: data.settings, version: CURRENT_VERSION });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  }
};
