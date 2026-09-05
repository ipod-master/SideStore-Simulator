import SwiftUI
import Foundation

struct ContentView: View {
    @StateObject private var viewModel = SimulatorStoreViewModel()
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            // Apps Tab
            NavigationView {
                List {
                    if viewModel.isLoading {
                        HStack {
                            Spacer()
                            ProgressView()
                            Spacer()
                        }
                    } else if viewModel.apps.isEmpty {
                        Text("No apps available")
                            .foregroundColor(.gray)
                    } else {
                        ForEach(viewModel.apps, id: \.id) { app in
                            NavigationLink(destination: AppDetailView(app: app, viewModel: viewModel)) {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(app.name)
                                            .font(.headline)
                                        Text(app.bundleId)
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    if app.installedOn.isEmpty {
                                        Image(systemName: "arrow.down.circle")
                                            .foregroundColor(.blue)
                                    } else {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundColor(.green)
                                    }
                                }
                            }
                        }
                    }
                }
                .navigationTitle("App Store")
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(action: { viewModel.refreshApps() }) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
            .tabItem {
                Label("Apps", systemImage: "app.badge")
            }
            .tag(0)

            // Simulators Tab
            NavigationView {
                List {
                    if viewModel.simulators.isEmpty {
                        Text("No simulators found")
                            .foregroundColor(.gray)
                    } else {
                        ForEach(viewModel.simulators, id: \.id) { simulator in
                            VStack(alignment: .leading, spacing: 8) {
                                HStack {
                                    VStack(alignment: .leading) {
                                        Text(simulator.name)
                                            .font(.headline)
                                        Text(simulator.id)
                                            .font(.caption)
                                            .foregroundColor(.gray)
                                    }
                                    Spacer()
                                    if simulator.booted {
                                        HStack(spacing: 4) {
                                            Circle()
                                                .fill(Color.green)
                                                .frame(width: 8, height: 8)
                                            Text("Booted")
                                                .font(.caption)
                                                .foregroundColor(.green)
                                        }
                                    }
                                }
                                Text(simulator.runtime)
                                    .font(.caption2)
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                }
                .navigationTitle("Simulators")
                .toolbar {
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button(action: { viewModel.refreshSimulators() }) {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                }
            }
            .tabItem {
                Label("Simulators", systemImage: "iphone")
            }
            .tag(1)

            // Settings Tab
            NavigationView {
                Form {
                    Section(header: Text("Server")) {
                        TextField("Server URL", text: $viewModel.serverURL)
                        Text("Connected: \(viewModel.isConnected ? "✅" : "❌")")
                            .foregroundColor(viewModel.isConnected ? .green : .red)
                    }

                    Section(header: Text("VPN")) {
                        Toggle("Enable VPN", isOn: $viewModel.vpnEnabled)
                        if viewModel.vpnEnabled {
                            TextField("VPN Config Path", text: $viewModel.vpnConfigPath)
                        }
                    }

                    Section(header: Text("About")) {
                        Text("SideStore Simulator v1.0.0")
                        Text("For iOS Simulator")
                            .foregroundColor(.gray)
                    }
                }
                .navigationTitle("Settings")
            }
            .tabItem {
                Label("Settings", systemImage: "gear")
            }
            .tag(2)
        }
        .onAppear {
            viewModel.loadSettings()
            viewModel.refreshApps()
            viewModel.refreshSimulators()
        }
    }
}

struct AppDetailView: View {
    let app: CatalogApp
    @ObservedObject var viewModel: SimulatorStoreViewModel
    @Environment(\.presentationMode) var presentationMode

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 8) {
                        Text(app.name)
                            .font(.title2)
                            .bold()
                        Text(app.bundleId)
                            .font(.caption)
                            .foregroundColor(.gray)
                        Text("v\(app.version)")
                            .font(.caption)
                    }
                    Spacer()
                }

                if !app.description.isEmpty {
                    Text(app.description)
                        .font(.body)
                        .foregroundColor(.gray)
                }

                Divider()

                Text("Install on Simulator")
                    .font(.headline)

                if viewModel.simulators.isEmpty {
                    Text("No simulators available")
                        .foregroundColor(.gray)
                } else {
                    ForEach(viewModel.simulators, id: \.id) { simulator in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(simulator.name)
                                    .font(.subheadline)
                                Text(simulator.id)
                                    .font(.caption)
                                    .foregroundColor(.gray)
                            }
                            Spacer()
                            if app.installedOn.contains(simulator.id) {
                                Button(action: { viewModel.uninstallApp(appId: app.id, simulatorId: simulator.id) }) {
                                    Text("Uninstall")
                                        .foregroundColor(.red)
                                }
                            } else {
                                Button(action: { viewModel.installApp(appId: app.id, simulatorId: simulator.id) }) {
                                    Text("Install")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .padding(.vertical, 8)
                    }
                }
            }
            .padding()
        }
        .navigationTitle("App Details")
    }
}

#Preview {
    ContentView()
}
