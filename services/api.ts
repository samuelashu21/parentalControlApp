import { Platform } from "react-native";

// On Android emulators, `localhost` resolves to the emulator loopback (10.0.2.2).
// On iOS simulators and web, `localhost` works directly.
// For physical devices, set this to your machine's local IP or hosted server URL.
const DEFAULT_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? `http://${DEFAULT_HOST}:5000/api`;

export async function authFetch(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
}
