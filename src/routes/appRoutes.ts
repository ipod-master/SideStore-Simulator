import { Router, Request, Response } from 'express';
import { SimulatorManager } from '../services/SimulatorManager';
import { AppInstaller } from '../services/AppInstaller';
import { AppCatalog, CatalogApp } from '../services/AppCatalog';
import { IPAExtractor } from '../services/IPAExtractor';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const simulatorManager = new SimulatorManager();
const appInstaller = new AppInstaller(simulatorManager);
const appCatalog = new AppCatalog();
const ipaExtractor = new IPAExtractor();

// Get all apps in catalog
router.get('/catalog', (req: Request, res: Response) => {
  const apps = appCatalog.getAllApps();
  res.json({ apps, count: apps.length });
});

// Search apps
router.get('/catalog/search', (req: Request, res: Response) => {
  const query = req.query.q as string;
  if (!query) {
    return res.status(400).json({ error: 'Search query required' });
  }
  const results = appCatalog.searchApps(query);
  res.json({ results, count: results.length });
});

// Get app details
router.get('/catalog/:appId', (req: Request, res: Response) => {
  const app = appCatalog.getApp(req.params.appId);
  if (!app) {
    return res.status(404).json({ error: 'App not found' });
  }
  res.json(app);
});

// Add app to catalog
router.post('/catalog/add', async (req: Request, res: Response) => {
  try {
    const { ipaPath, name, description } = req.body;

    if (!ipaPath || !name) {
      return res.status(400).json({ error: 'ipaPath and name required' });
    }

    // Extract app info from IPA
    const appInfo = await ipaExtractor.extractAppInfo(ipaPath);

    const app: CatalogApp = {
      id: uuidv4(),
      name,
      bundleId: appInfo.bundleId,
      version: appInfo.version,
      description: description || '',
      ipaPath,
      installedOn: [],
      lastUpdated: new Date()
    };

    appCatalog.addApp(app);
    res.json({ success: true, app });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Install app to simulator
router.post('/install', async (req: Request, res: Response) => {
  try {
    const { appId, simulatorId } = req.body;

    if (!appId || !simulatorId) {
      return res.status(400).json({ error: 'appId and simulatorId required' });
    }

    const app = appCatalog.getApp(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found in catalog' });
    }

    // Install the app
    await appInstaller.installApp(simulatorId, app.ipaPath);

    // Mark as installed
    appCatalog.markAppInstalled(appId, simulatorId);

    res.json({
      success: true,
      message: `${app.name} installed on simulator ${simulatorId}`
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Uninstall app from simulator
router.post('/uninstall', async (req: Request, res: Response) => {
  try {
    const { appId, simulatorId } = req.body;

    if (!appId || !simulatorId) {
      return res.status(400).json({ error: 'appId and simulatorId required' });
    }

    const app = appCatalog.getApp(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found in catalog' });
    }

    // Uninstall the app
    await appInstaller.uninstallApp(simulatorId, app.bundleId);

    // Mark as uninstalled
    appCatalog.markAppUninstalled(appId, simulatorId);

    res.json({
      success: true,
      message: `${app.name} uninstalled from simulator ${simulatorId}`
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Launch app on simulator
router.post('/launch', async (req: Request, res: Response) => {
  try {
    const { appId, simulatorId } = req.body;

    if (!appId || !simulatorId) {
      return res.status(400).json({ error: 'appId and simulatorId required' });
    }

    const app = appCatalog.getApp(appId);
    if (!app) {
      return res.status(404).json({ error: 'App not found in catalog' });
    }

    await appInstaller.launchApp(simulatorId, app.bundleId);
    res.json({ success: true, message: `Launched ${app.name}` });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Get apps installed on simulator
router.get('/simulator/:simulatorId/apps', (req: Request, res: Response) => {
  const apps = appCatalog.getAppsForSimulator(req.params.simulatorId);
  res.json({ apps, count: apps.length });
});

export default router;
