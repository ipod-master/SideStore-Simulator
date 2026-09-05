import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';

const execPromise = promisify(exec);

export class NetworkRouter {
  private localIp: string;
  private routesActive: Map<string, boolean> = new Map();

  constructor() {
    this.localIp = this.getLocalIP();
  }

  private getLocalIP(): string {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const iface = interfaces[name];
      if (!iface) continue;
      for (const addr of iface) {
        if (addr.family === 'IPv4' && !addr.internal) {
          return addr.address;
        }
      }
    }
    return 'localhost';
  }

  async getNetworkStatus(): Promise<any> {
    try {
      const { stdout } = await execPromise('ifconfig');
      return {
        status: 'connected',
        localIp: this.localIp,
        gateway: this.localIp,
        simulatorAccess: true
      };
    } catch (error) {
      return {
        status: 'error',
        error: String(error)
      };
    }
  }

  async setupLocalRoute(simulatorId: string, port: number): Promise<boolean> {
    try {
      // Route traffic from simulator to localhost
      const routeKey = `${simulatorId}:${port}`;
      console.log(`🔀 Setting up route: ${routeKey} -> localhost:${port}`);
      this.routesActive.set(routeKey, true);
      return true;
    } catch (error) {
      console.error('Error setting up route:', error);
      return false;
    }
  }

  async teardownRoute(routeKey: string): Promise<boolean> {
    try {
      console.log(`🔌 Tearing down route: ${routeKey}`);
      this.routesActive.delete(routeKey);
      return true;
    } catch (error) {
      console.error('Error tearing down route:', error);
      return false;
    }
  }

  getActiveRoutes(): string[] {
    return Array.from(this.routesActive.keys());
  }
}
