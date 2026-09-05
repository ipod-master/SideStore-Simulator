# Quick Start

## Prerequisites

- macOS 12+
- Xcode 13+
- Node.js 16+

## 1. Install & Build Backend

```bash
cd SideStore-Simulator
npm install
npm run build
```

## 2. Start Server

```bash
npm start
```

Server runs on `http://localhost:8080`

## 3. Open Web Console

Visit: http://localhost:8080/web/ (open `web/index.html` in browser)

## 4. Use iOS App (Optional)

Open the Xcode project in `ios/SimulatorStore/` and run on your Mac.

## 5. Add Apps to Catalog

```bash
curl -X POST http://localhost:8080/app/catalog/add \
  -H "Content-Type: application/json" \
  -d '{
    "ipaPath": "/path/to/app.ipa",
    "name": "My App",
    "description": "Test app"
  }'
```

## 6. Install to Simulator

```bash
curl -X POST http://localhost:8080/app/install \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "<app-uuid-from-step-5>",
    "simulatorId": "<simulator-id-from-/api/simulators>"
  }'
```

## VPN Setup (Optional)

Enable local dev VPN:

1. Edit `.env`:
```
VPN_ENABLED=true
VPN_TYPE=openvpn
```

2. Place VPN config at `./config/vpn.conf`

3. Connect via API:
```bash
curl -X POST http://localhost:8080/api/vpn/connect \
  -H "Content-Type: application/json" \
  -d '{
    "vpnConfig": {
      "name": "LocalVPN",
      "type": "openvpn",
      "configPath": "./config/vpn.conf"
    }
  }'
```

Done! Your simulator now has network access via the Mac's routing.
