// client/utils/activityStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACTIVITY_STORAGE_KEY } from "@/constants/activity";

type ActivityItem = {
  id: string;
  title: string; // e.g., "Request assistance"
  placeName?: string;
  createdAt: string; // ISO
  status: "pending" | "accepted" | "done" | "canceled";
  meta?: any;
};

export async function getActivity(): Promise<ActivityItem[]> {
  const raw = await AsyncStorage.getItem(ACTIVITY_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function addActivityItem(item: ActivityItem): Promise<void> {
  const list = await getActivity();
  list.unshift(item);
  await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(list));
}

export async function updateActivityItem(
  id: string,
  patch: Partial<ActivityItem>
): Promise<void> {
  const list = await getActivity();
  const idx = list.findIndex((i) => i.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(list));
  }
}
