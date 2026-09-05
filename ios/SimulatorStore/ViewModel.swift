import Foundation

class SimulatorStoreViewModel: ObservableObject {
    @Published var apps: [CatalogApp] = []
    @Published var simulators: [Simulator] = []
    @Published var isLoading = false
    @Published var isConnected = false
    @Published var serverURL = "http://localhost:8080"
    @Published var vpnEnabled = false
    @Published var vpnConfigPath = ""
    @Published var errorMessage: String?

    private let apiClient = APIClient()

    func loadSettings() {
        if let savedURL = UserDefaults.standard.string(forKey: "serverURL") {
            serverURL = savedURL
        }
        vpnEnabled = UserDefaults.standard.bool(forKey: "vpnEnabled")
        if let savedVPNPath = UserDefaults.standard.string(forKey: "vpnConfigPath") {
            vpnConfigPath = savedVPNPath
        }

        apiClient.baseURL = serverURL
        checkConnection()
    }

    func refreshApps() {
        isLoading = true
        apiClient.get("/app/catalog") { (response: AppListResponse) in
            DispatchQueue.main.async {
                self.apps = response.apps
                self.isLoading = false
            }
        }
    }

    func refreshSimulators() {
        apiClient.get("/api/simulators") { (response: SimulatorListResponse) in
            DispatchQueue.main.async {
                self.simulators = response.simulators
            }
        }
    }

    func installApp(appId: String, simulatorId: String) {
        let payload: [String: String] = ["appId": appId, "simulatorId": simulatorId]
        apiClient.post("/app/install", payload: payload) { (response: SuccessResponse) in
            DispatchQueue.main.async {
                if response.success ?? false {
                    self.refreshApps()
                    self.showAlert("Success", response.message ?? "App installed")
                } else {
                    self.showAlert("Error", response.error ?? "Installation failed")
                }
            }
        }
    }

    func uninstallApp(appId: String, simulatorId: String) {
        let payload: [String: String] = ["appId": appId, "simulatorId": simulatorId]
        apiClient.post("/app/uninstall", payload: payload) { (response: SuccessResponse) in
            DispatchQueue.main.async {
                if response.success ?? false {
                    self.refreshApps()
                    self.showAlert("Success", response.message ?? "App uninstalled")
                } else {
                    self.showAlert("Error", response.error ?? "Uninstall failed")
                }
            }
        }
    }

    func checkConnection() {
        apiClient.get("/health") { (response: HealthResponse) in
            DispatchQueue.main.async {
                self.isConnected = response.status == "ok"
            }
        }
    }

    private func showAlert(_ title: String, _ message: String) {
        errorMessage = message
    }
}

struct AppListResponse: Codable {
    let apps: [CatalogApp]
    let count: Int
}

struct SimulatorListResponse: Codable {
    let simulators: [Simulator]
}

struct SuccessResponse: Codable {
    let success: Bool?
    let message: String?
    let error: String?
}

struct HealthResponse: Codable {
    let status: String
}
