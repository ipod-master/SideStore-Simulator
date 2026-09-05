import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export interface Simulator {
  id: string;
  name: string;
  runtime: string;
  state: string;
  booted: boolean;
}

export class SimulatorManager {
  private simulators: Map<string, Simulator> = new Map();
  private discoveryInterval: NodeJS.Timeout | null = null;

  async listSimulators(): Promise<Simulator[]> {
    try {
      const { stdout } = await execPromise('xcrun simctl list devices --json');
      const data = JSON.parse(stdout);
      const simulators: Simulator[] = [];

      for (const [runtime, devices] of Object.entries(data.devices)) {
        for (const device of devices as any[]) {
          simulators.push({
            id: device.udid,
            name: device.name,
            runtime,
            state: device.state,
            booted: device.state === 'Booted'
          });
          this.simulators.set(device.udid, simulators[simulators.length - 1]);
        }
      }

      return simulators;
    } catch (error) {
      console.error('Error listing simulators:', error);
      return [];
    }
  }

  async bootSimulator(simulatorId: string): Promise<boolean> {
    try {
      await execPromise(`xcrun simctl boot ${simulatorId}`);
      return true;
    } catch (error) {
      console.error(`Error booting simulator ${simulatorId}:`, error);
      return false;
    }
  }

  async getSimulatorInfo(simulatorId: string): Promise<Simulator | null> {
    return this.simulators.get(simulatorId) || null;
  }

  startServiceDiscovery(): void {
    this.discoveryInterval = setInterval(async () => {
      await this.listSimulators();
      console.log(`📱 Found ${this.simulators.size} simulators`);
    }, 5000);
  }

  stopServiceDiscovery(): void {
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval);
    }
  }
}
