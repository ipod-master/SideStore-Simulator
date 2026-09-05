# SideStore-Simulator

A modified version of SideStore that enables app installation into the iOS Simulator via Mac network routing and local development VPN integration.

## Features

- ✅ Install apps directly to iOS Simulator without physical iPhone
- ✅ Routes through Mac's WiFi network (simulator copies Mac network)
- ✅ Local development VPN support
- ✅ Headless/remote simulator support
- ✅ Bypass physical device requirement

## Architecture

```
┌─────────────────────────────────┐
│   SideStore-Simulator Server    │
│   (Running on Mac)              │
└────────────┬────────────────────┘
             │
             ├─→ Local Dev VPN
             ├─→ Network Router
             └─→ Simulator Connector
             
┌─────────────────────────────────┐
│   iOS Simulator                 │
│   (on localhost/Mac Network)    │
└─────────────────────────────────┘
```

## Quick Start

```bash
git clone https://github.com/ipod-master/SideStore-Simulator
cd SideStore-Simulator
npm install
npm start
```

## Requirements

- macOS 12+
- Xcode with iOS Simulator
- Node.js 16+
- Local development VPN (optional but recommended)

## Configuration

See `config/simulator.config.json` for detailed configuration options.

## How It Works

1. **Network Routing** - Simulator uses Mac's network, so we route traffic through localhost
2. **App Installation** - Uses Xcode's simctl and custom hooks to install .ipa files
3. **VPN Integration** - Routes through local dev VPN for testing
4. **Service Discovery** - Auto-detects running simulators on Mac

## License

MIT
