import { exec } from 'child_process';
import { promisify } from 'util';
import { SimulatorManager } from './SimulatorManager';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

export class AppInstaller {
  constructor(private simulatorManager: SimulatorManager) {}

  async installApp(simulatorId: string, appPath: string): Promise<any> {
    try {
      // Verify app exists
      if (!fs.existsSync(appPath)) {
        throw new Error(`App not found: ${appPath}`);
      }

      // Boot simulator if not already booted
      const simulator = await this.simulatorManager.getSimulatorInfo(simulatorId);
      if (!simulator?.booted) {
        console.log(`⏱️  Booting simulator ${simulatorId}...`);
        await this.simulatorManager.bootSimulator(simulatorId);
        // Wait for simulator to fully boot
        await new Promise(resolve => setTimeout(resolve, 3000));
      }

      // Install app using simctl
      const { stdout, stderr } = await execPromise(
        `xcrun simctl install booted "${appPath}"`
      );

      console.log(`✅ App installed successfully to ${simulatorId}`);
      return {
        success: true,
        simulatorId,
        appPath,
        message: stdout
      };
    } catch (error) {
      console.error('Error installing app:', error);
      throw error;
    }
  }

  async uninstallApp(simulatorId: string, bundleId: string): Promise<any> {
    try {
      const { stdout } = await execPromise(
        `xcrun simctl uninstall ${simulatorId} ${bundleId}`
      );
      return {
        success: true,
        simulatorId,
        bundleId,
        message: stdout
      };
    } catch (error) {
      console.error('Error uninstalling app:', error);
      throw error;
    }
  }

  async launchApp(simulatorId: string, bundleId: string): Promise<any> {
    try {
      const { stdout } = await execPromise(
        `xcrun simctl launch ${simulatorId} ${bundleId}`
      );
      return {
        success: true,
        simulatorId,
        bundleId,
        message: stdout
      };
    } catch (error) {
      console.error('Error launching app:', error);
      throw error;
    }
  }

  async getInstalledApps(simulatorId: string): Promise<string[]> {
    try {
      const { stdout } = await execPromise(
        `xcrun simctl listapps ${simulatorId}`
      );
      return stdout.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Error getting installed apps:', error);
      return [];
    }
  }
}
