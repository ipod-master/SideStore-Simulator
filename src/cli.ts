#!/usr/bin/env node

import { SimulatorManager } from './services/SimulatorManager';
import { AppInstaller } from './services/AppInstaller';
import * as fs from 'fs';

const args = process.argv.slice(2);
const command = args[0];

const simulatorManager = new SimulatorManager();
const appInstaller = new AppInstaller(simulatorManager);

async function main() {
  try {
    switch (command) {
      case 'list':
        const simulators = await simulatorManager.listSimulators();
        console.log('Available Simulators:');
        simulators.forEach(sim => {
          console.log(`  ${sim.id}: ${sim.name} (${sim.state})`);
        });
        break;

      case 'install':
        const appPath = args[1];
        const simId = args[2];
        if (!appPath || !simId) {
          console.error('Usage: cli.ts install <app-path> <simulator-id>');
          process.exit(1);
        }
        await appInstaller.installApp(simId, appPath);
        break;

      case 'launch':
        const bundleId = args[1];
        const simulatorId = args[2];
        if (!bundleId || !simulatorId) {
          console.error('Usage: cli.ts launch <bundle-id> <simulator-id>');
          process.exit(1);
        }
        await appInstaller.launchApp(simulatorId, bundleId);
        break;

      default:
        console.log('SideStore-Simulator CLI');
        console.log('Commands:');
        console.log('  list - List available simulators');
        console.log('  install <app-path> <simulator-id> - Install app to simulator');
        console.log('  launch <bundle-id> <simulator-id> - Launch app on simulator');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
