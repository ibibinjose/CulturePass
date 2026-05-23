import { db } from '../admin';

export interface SystemConfig {
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  minAppVersion?: string;
  lastUpdatedBy?: string;
  updatedAt: string;
}

const configDoc = () => db.collection('system').doc('config');

export const systemConfigService = {
  async getConfig(): Promise<SystemConfig> {
    const snap = await configDoc().get();
    if (!snap.exists) {
      // Default config
      return {
        maintenanceMode: false,
        updatedAt: new Date().toISOString(),
      };
    }
    return snap.data() as SystemConfig;
  },

  async updateConfig(data: Partial<SystemConfig>, userId: string): Promise<SystemConfig> {
    const now = new Date().toISOString();
    const updates = {
      ...data,
      lastUpdatedBy: userId,
      updatedAt: now,
    };
    
    await configDoc().set(updates, { merge: true });
    return this.getConfig();
  }
};
