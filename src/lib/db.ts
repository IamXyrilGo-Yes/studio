import { Client, AppData } from './types';

const STORAGE_KEY = 'pisomate_data';

export const db = {
  getData: (): AppData => {
    if (typeof window === 'undefined') return { clients: [] };
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { clients: [] };
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Failed to parse storage', e);
      return { clients: [] };
    }
  },

  saveData: (data: AppData) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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

  exportData: () => {
    const data = db.getData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pisomate_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};