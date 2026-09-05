import * as fs from 'fs';
import * as path from 'path';

export interface CatalogApp {
  id: string;
  name: string;
  bundleId: string;
  version: string;
  description: string;
  ipaPath: string;
  icon?: string;
  installedOn: string[];
  lastUpdated: Date;
}

export class AppCatalog {
  private catalogPath: string;
  private apps: Map<string, CatalogApp> = new Map();

  constructor(catalogPath: string = './catalog.json') {
    this.catalogPath = catalogPath;
    this.loadCatalog();
  }

  private loadCatalog(): void {
    try {
      if (fs.existsSync(this.catalogPath)) {
        const data = fs.readFileSync(this.catalogPath, 'utf-8');
        const catalog = JSON.parse(data);
        for (const app of catalog.apps || []) {
          this.apps.set(app.id, app);
        }
        console.log(`📚 Loaded ${this.apps.size} apps from catalog`);
      }
    } catch (error) {
      console.error('Error loading catalog:', error);
    }
  }

  private saveCatalog(): void {
    try {
      const catalog = {
        version: '1.0',
        lastUpdated: new Date(),
        apps: Array.from(this.apps.values())
      };
      fs.writeFileSync(this.catalogPath, JSON.stringify(catalog, null, 2));
    } catch (error) {
      console.error('Error saving catalog:', error);
    }
  }

  addApp(app: CatalogApp): void {
    this.apps.set(app.id, app);
    this.saveCatalog();
    console.log(`✅ Added app to catalog: ${app.name}`);
  }

  removeApp(appId: string): boolean {
    const removed = this.apps.delete(appId);
    if (removed) {
      this.saveCatalog();
      console.log(`🗑️  Removed app from catalog: ${appId}`);
    }
    return removed;
  }

  getApp(appId: string): CatalogApp | undefined {
    return this.apps.get(appId);
  }

  getAllApps(): CatalogApp[] {
    return Array.from(this.apps.values());
  }

  getAppsForSimulator(simulatorId: string): CatalogApp[] {
    return this.getAllApps().filter(app => app.installedOn.includes(simulatorId));
  }

  markAppInstalled(appId: string, simulatorId: string): void {
    const app = this.apps.get(appId);
    if (app && !app.installedOn.includes(simulatorId)) {
      app.installedOn.push(simulatorId);
      app.lastUpdated = new Date();
      this.saveCatalog();
      console.log(`✅ Marked ${app.name} as installed on ${simulatorId}`);
    }
  }

  markAppUninstalled(appId: string, simulatorId: string): void {
    const app = this.apps.get(appId);
    if (app) {
      app.installedOn = app.installedOn.filter(id => id !== simulatorId);
      app.lastUpdated = new Date();
      this.saveCatalog();
      console.log(`✅ Marked ${app.name} as uninstalled from ${simulatorId}`);
    }
  }

  searchApps(query: string): CatalogApp[] {
    const q = query.toLowerCase();
    return this.getAllApps().filter(
      app =>
        app.name.toLowerCase().includes(q) ||
        app.bundleId.toLowerCase().includes(q) ||
        app.description.toLowerCase().includes(q)
    );
  }
}
