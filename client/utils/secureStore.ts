// utils/secureStore.ts
import * as SecureStore from "expo-secure-store";

export const CRED_PREFIX = "cred_";
export const LAST_ID_KEY = "cred_last";

export const safeKey = (id: string) =>
  CRED_PREFIX +
  id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/gi, "_");

export async function savePasswordFor(id: string, password: string) {
  if (!id) return;
  await SecureStore.setItemAsync(safeKey(id), password);
  await SecureStore.setItemAsync(LAST_ID_KEY, id);
}

export async function getPasswordFor(id: string) {
  if (!id) return null;
  return SecureStore.getItemAsync(safeKey(id));
}

export async function removePasswordFor(id: string) {
  if (!id) return;
  await SecureStore.deleteItemAsync(safeKey(id));
  const last = await SecureStore.getItemAsync(LAST_ID_KEY);
  if (last === id) await SecureStore.deleteItemAsync(LAST_ID_KEY);
}
