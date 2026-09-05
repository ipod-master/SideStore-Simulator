import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';

const execPromise = promisify(exec);

export interface AppInfo {
  bundleId: string;
  appName: string;
  version: string;
  minOSVersion: string;
  icon?: Buffer;
}

export class IPAExtractor {
  async extractAppInfo(ipaPath: string): Promise<AppInfo> {
    try {
      const tempDir = `./temp_${Date.now()}`;
      fs.mkdirSync(tempDir, { recursive: true });

      // Extract IPA (which is a zip file)
      await execPromise(`unzip -q "${ipaPath}" -d ${tempDir}`);

      // Find Info.plist in Payload folder
      const infoPlistPath = path.join(
        tempDir,
        'Payload',
        '*.app',
        'Info.plist'
      );

      const { stdout } = await execPromise(
        `find ${tempDir} -name "Info.plist" -path "*/Payload/*.app/*"`
      );

      if (!stdout.trim()) {
        throw new Error('Info.plist not found in IPA');
      }

      const actualPlistPath = stdout.trim().split('\n')[0];

      // Parse plist
      const { stdout: plistContent } = await execPromise(
        `plutil -p "${actualPlistPath}"`
      );

      const appInfo = this.parsePlist(plistContent);

      // Try to extract app icon
      const appDir = path.dirname(actualPlistPath);
      const icon = await this.extractIcon(appDir);

      // Cleanup
      fs.rmSync(tempDir, { recursive: true });

      return {
        ...appInfo,
        icon
      };
    } catch (error) {
      console.error('Error extracting app info:', error);
      throw error;
    }
  }

  private parsePlist(content: string): AppInfo {
    // Simple plist parser for key values
    const bundleIdMatch = content.match(/"CFBundleIdentifier" => "([^"]+)"/);
    const appNameMatch = content.match(/"CFBundleName" => "([^"]+)"/);
    const versionMatch = content.match(/"CFBundleShortVersionString" => "([^"]+)"/);
    const minOSMatch = content.match(/"MinimumOSVersion" => "([^"]+)"/);

    return {
      bundleId: bundleIdMatch ? bundleIdMatch[1] : 'unknown',
      appName: appNameMatch ? appNameMatch[1] : 'App',
      version: versionMatch ? versionMatch[1] : '1.0',
      minOSVersion: minOSMatch ? minOSMatch[1] : '12.0'
    };
  }

  private async extractIcon(appDir: string): Promise<Buffer | undefined> {
    try {
      // Find AppIcon.appiconset or similar
      const { stdout } = await execPromise(
        `find "${appDir}" -name "AppIcon*" -type d`
      );

      if (stdout.trim()) {
        const iconDir = stdout.trim().split('\n')[0];
        const iconFile = fs.readdirSync(iconDir).find(f => f.endsWith('.png'));
        if (iconFile) {
          return fs.readFileSync(path.join(iconDir, iconFile));
        }
      }
      return undefined;
    } catch {
      return undefined;
    }
  }

  async convertAppToIPA(appPath: string): Promise<string> {
    try {
      const ipaPath = `${appPath.replace('.app', '')}.ipa`;
      const payloadDir = './build/Payload';

      fs.mkdirSync(payloadDir, { recursive: true });
      await execPromise(`cp -r "${appPath}" "${payloadDir}/"`);
      await execPromise(
        `cd ./build && zip -r -q "${path.basename(ipaPath)}" Payload`
      );

      return path.join('./build', path.basename(ipaPath));
    } catch (error) {
      console.error('Error converting app to IPA:', error);
      throw error;
    }
  }
}
