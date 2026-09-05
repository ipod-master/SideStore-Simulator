import express, { Request, Response } from 'express';
import { SimulatorManager } from './services/SimulatorManager';
import { AppInstaller } from './services/AppInstaller';
import { NetworkRouter } from './services/NetworkRouter';
import { VPNIntegration } from './services/VPNIntegration';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const VPN_ENABLED = process.env.VPN_ENABLED === 'true';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const simulatorManager = new SimulatorManager();
const appInstaller = new AppInstaller(simulatorManager);
const networkRouter = new NetworkRouter();
const vpnIntegration = VPN_ENABLED ? new VPNIntegration() : null;

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', vpn_enabled: VPN_ENABLED });
});

// List available simulators
app.get('/api/simulators', async (req: Request, res: Response) => {
  try {
    const simulators = await simulatorManager.listSimulators();
    res.json({ simulators });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Install app to simulator
app.post('/api/install', async (req: Request, res: Response) => {
  try {
    const { appPath, simulatorId } = req.body;

    if (!appPath || !simulatorId) {
      return res.status(400).json({ error: 'appPath and simulatorId required' });
    }

    const result = await appInstaller.installApp(simulatorId, appPath);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Get network route status
app.get('/api/network', async (req: Request, res: Response) => {
  try {
    const status = await networkRouter.getNetworkStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// VPN routing endpoint
if (vpnIntegration) {
  app.post('/api/vpn/connect', async (req: Request, res: Response) => {
    try {
      const { vpnConfig } = req.body;
      const result = await vpnIntegration.connect(vpnConfig);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SideStore-Simulator running on port ${PORT}`);
  console.log(`📱 VPN Integration: ${VPN_ENABLED ? 'ENABLED' : 'DISABLED'}`);
  simulatorManager.startServiceDiscovery();
});
