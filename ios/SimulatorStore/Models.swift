import Foundation

struct CatalogApp: Codable, Identifiable {
    let id: String
    let name: String
    let bundleId: String
    let version: String
    let description: String
    let ipaPath: String
    let icon: String?
    var installedOn: [String]
    let lastUpdated: String
}

struct Simulator: Codable, Identifiable {
    let id: String
    let name: String
    let runtime: String
    let state: String
    let booted: Bool
}

struct ServerResponse<T: Codable>: Codable {
    let success: Bool?
    let error: String?
    let data: T?
}
