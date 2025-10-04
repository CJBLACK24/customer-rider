// client/constants/index.ts
import { Platform, NativeModules } from "react-native";
import Constants from "expo-constants";

// Try to infer your Metro/Expo host automatically in dev
function resolveHost(): string {
  // Expo Router / SDK 50+ (preferred)
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    // Legacy manifest fallback
    (Constants as any)?.manifest?.hostUri;

  if (hostUri) return hostUri.split(":")[0];

  // Another fallback: Metro script URL
  const scriptURL: string | undefined = (NativeModules as any)?.SourceCode?.scriptURL;
  const m = scriptURL?.match(/https?:\/\/(.*?):\d+/);
  if (m?.[1]) return m[1];

  // LAST RESORT: put your current LAN IP here (changes with Wi-Fi/hotspot)
  return "192.168.58.213";
}

// Optional: override via env for production/EAS builds
const PUBLIC_URL = process.env.EXPO_PUBLIC_API_URL;

const host = resolveHost();

export const API_URL =
  PUBLIC_URL ||
  (Platform.OS === "web" ? "http://localhost:3000" : `http://${host}:3000`);

export const CLOUDINARY_CLOUD_NAME = "cjblackdev";
export const CLOUDINARY_UPLOAD_PRESET = "Images";
