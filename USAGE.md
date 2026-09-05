# SideStore-Simulator Usage Guide

## Installation

```bash
git clone https://github.com/ipod-master/SideStore-Simulator
cd SideStore-Simulator
npm install
npm run build
```

## Starting the Server

```bash
npm start
```

Server runs on `http://localhost:8080`

## API Endpoints

### Simulators

#### List Simulators
```bash
curl http://localhost:8080/api/simulators
```

### App Catalog

#### List All Apps
```bash
curl http://localhost:8080/app/catalog
```

#### Search Apps
```bash
curl "http://localhost:8080/app/catalog/search?q=MyApp"
```

#### Get App Details
```bash
curl http://localhost:8080/app/catalog/{appId}
```

#### Add App to Catalog
```bash
curl -X POST http://localhost:8080/app/catalog/add \
  -H "Content-Type: application/json" \
  -d '{
    "ipaPath": "/path/to/app.ipa",
    "name": "My App",
    "description": "My test app"
  }'
```

### Installation

#### Install App to Simulator
```bash
curl -X POST http://localhost:8080/app/install \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "app-uuid",
    "simulatorId": "simulator-uuid"
  }'
```

#### Uninstall App from Simulator
```bash
curl -X POST http://localhost:8080/app/uninstall \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "app-uuid",
    "simulatorId": "simulator-uuid"
  }'
```

#### Launch App on Simulator
```bash
curl -X POST http://localhost:8080/app/launch \
  -H "Content-Type: application/json" \
  -d '{
    "appId": "app-uuid",
    "simulatorId": "simulator-uuid"
  }'
```

#### Get Installed Apps
```bash
curl http://localhost:8080/app/simulator/{simulatorId}/apps
```

## CLI Usage

### List Simulators
```bash
npm run build && node dist/cli.js list
```

### Install App
```bash
node dist/cli.js install /path/to/app.app simulator-uuid
```

### Launch App
```bash
node dist/cli.js launch com.example.app simulator-uuid
```

## VPN Integration

Enable VPN in `.env`:

```
VPN_ENABLED=true
VPN_TYPE=openvpn
VPN_CONFIG_PATH=./config/vpn.conf
```

Then connect:
```bash
curl -X POST http://localhost:8080/api/vpn/connect \
  -H "Content-Type: application/json" \
  -d '{
    "vpnConfig": {
      "name": "MyVPN",
      "type": "openvpn",
      "configPath": "./config/vpn.conf"
    }
  }'
```

## How It Works

### Network Flow
1. Mac runs SideStore-Simulator server on localhost:8080
2. Simulator shares Mac's network interface
3. Apps installed to simulator via Xcode's simctl
4. Network traffic routes through Mac's routing tables
5. VPN (optional) applies to all simulator traffic

### App Installation Flow
1. App added to catalog (extracts metadata from IPA)
2. User requests installation to specific simulator
3. SideStore boots simulator if needed
4. Uses `xcrun simctl install booted <app>` to install
5. Tracks installation status in catalog

## Configuration

Edit `config/simulator.config.json` to customize:
- Auto-boot behavior
- Timeouts
- Network routing
- VPN settings

## Troubleshooting

### Simulator won't boot
```bash
xcrun simctl erase all
xcrun simctl list devices
```

### App installation fails
- Ensure simulator is running: `xcrun simctl list`
- Check app format: should be `.app` or `.ipa`
- Verify path exists and is readable

### VPN connection fails
- Check VPN config path in `.env`
- Ensure OpenVPN/WireGuard is installed
- Test VPN manually first

## Advanced Usage

### Bulk Install
```bash
for app in apps/*.ipa; do
  curl -X POST http://localhost:8080/app/catalog/add \
    -H "Content-Type: application/json" \
    -d "{\"ipaPath\": \"$app\", \"name\": \"$(basename $app)\"}"
done
```

### Monitor Simulator
```bash
watch -n 1 'curl http://localhost:8080/api/simulators'
```
