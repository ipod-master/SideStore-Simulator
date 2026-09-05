import Foundation

class APIClient {
    var baseURL: String = "http://localhost:8080"

    func get<T: Codable>(_ endpoint: String, completion: @escaping (T) -> Void) {
        guard let url = URL(string: baseURL + endpoint) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        URLSession.shared.dataTask(with: request) { data, _, error in
            if let data = data, error == nil {
                if let response = try? JSONDecoder().decode(T.self, from: data) {
                    completion(response)
                }
            }
        }.resume()
    }

    func post<T: Codable>(
        _ endpoint: String,
        payload: [String: String],
        completion: @escaping (T) -> Void
    ) {
        guard let url = URL(string: baseURL + endpoint) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if let jsonData = try? JSONSerialization.data(withJSONObject: payload) {
            request.httpBody = jsonData
        }

        URLSession.shared.dataTask(with: request) { data, _, error in
            if let data = data, error == nil {
                if let response = try? JSONDecoder().decode(T.self, from: data) {
                    completion(response)
                }
            }
        }.resume()
    }
}
