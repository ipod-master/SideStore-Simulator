import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as plist from 'plist';

const execPromise = promisify(exec);

export interface XcodeProject {
  path: string;
  name: string;
  bundleId: string;
  targets: string[];
}

export class XcodeIntegration {
  async findProjects(searchPath: string): Promise<XcodeProject[]> {
    try {
      const { stdout } = await execPromise(
        `find ${searchPath} -name "*.xcodeproj" -type d`
      );
      const projects: XcodeProject[] = [];
      const projectPaths = stdout.trim().split('\n').filter(p => p);

      for (const projectPath of projectPaths) {
        const projectName = path.basename(projectPath, '.xcodeproj');
        const infoPlistPath = path.join(projectPath, 'project.pbxproj');

        if (fs.existsSync(infoPlistPath)) {
          projects.push({
            path: projectPath,
            name: projectName,
            bundleId: await this.extractBundleId(projectPath),
            targets: await this.extractTargets(projectPath)
          });
        }
      }

      return projects;
    } catch (error) {
      console.error('Error finding Xcode projects:', error);
      return [];
    }
  }

  private async extractBundleId(projectPath: string): Promise<string> {
    try {
      const { stdout } = await execPromise(
        `xcodebuild -project ${projectPath} -showBuildSettings | grep PRODUCT_BUNDLE_IDENTIFIER | head -1`
      );
      const match = stdout.match(/PRODUCT_BUNDLE_IDENTIFIER = (.+)/);
      return match ? match[1].trim() : 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private async extractTargets(projectPath: string): Promise<string[]> {
    try {
      const { stdout } = await execPromise(
        `xcodebuild -project ${projectPath} -list -json`
      );
      const data = JSON.parse(stdout);
      return data.project.targets || [];
    } catch {
      return [];
    }
  }

  async buildForSimulator(
    projectPath: string,
    target: string,
    configuration: string = 'Debug'
  ): Promise<string> {
    try {
      console.log(`🔨 Building ${target} for simulator...`);
      const { stdout, stderr } = await execPromise(
        `xcodebuild -project ${projectPath} -target ${target} -configuration ${configuration} -sdk iphonesimulator -derivedDataPath ./build`
      );
      console.log(`✅ Build succeeded`);
      return path.join(
        './build',
        'Build/Products',
        `${configuration}-iphonesimulator`,
        `${target}.app`
      );
    } catch (error) {
      console.error('Build failed:', error);
      throw error;
    }
  }

  async buildArchive(projectPath: string, target: string): Promise<string> {
    try {
      console.log(`📦 Creating archive for ${target}...`);
      const archivePath = `./build/${target}.xcarchive`;
      await execPromise(
        `xcodebuild -project ${projectPath} -target ${target} -configuration Release -sdk iphoneos archive -archivePath ${archivePath}`
      );
      return archivePath;
    } catch (error) {
      console.error('Archive failed:', error);
      throw error;
    }
  }

  async exportIPA(archivePath: string): Promise<string> {
    try {
      console.log(`📤 Exporting IPA from archive...`);
      const ipaPath = `./build/${path.basename(archivePath, '.xcarchive')}.ipa`;
      const exportOptions = {
        method: 'development',
        signingStyle: 'automatic'
      };

      const optionsPath = './build/ExportOptions.plist';
      fs.writeFileSync(optionsPath, plist.build(exportOptions));

      await execPromise(
        `xcodebuild -exportArchive -archivePath ${archivePath} -exportPath ./build -exportOptionsPlist ${optionsPath}`
      );

      return ipaPath;
    } catch (error) {
      console.error('IPA export failed:', error);
      throw error;
    }
  }
}
