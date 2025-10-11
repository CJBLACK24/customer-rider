// client/utils/activityStore.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ACTIVITY_STORAGE_KEY } from "@/constants/activity";

export type ActivityItem = {
  id: string;
  title: string; // e.g., "Request assistance"
  placeName?: string;
  createdAt: string; // ISO
  status: "pending" | "accepted" | "done" | "canceled";
  /** meta is intentionally flexible. We'll persist `assistId` inside it. */
  meta?: {
    vehicleModel?: string;
    plateNumber?: string;
    otherInfo?: string;
    assistId?: string | null;
    [k: string]: any;
  };
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

export async function setActivity(list: ActivityItem[]) {
  await AsyncStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(list));
}

export async function addActivityItem(item: ActivityItem): Promise<void> {
  const list = await getActivity();
  list.unshift(item);
  await setActivity(list);
}

export async function updateActivityItem(
  id: string,
  patch: Partial<ActivityItem>
): Promise<void> {
  const list = await getActivity();
  const idx = list.findIndex((i) => i.id === id);
  if (idx >= 0) {
    const prev = list[idx];
    list[idx] = {
      ...prev,
      ...patch,
      meta: { ...(prev.meta || {}), ...(patch.meta || {}) },
    };
    await setActivity(list);
  }
}

/** Seed demo data so your Activity page matches the Figma list if empty */
export async function seedDemoActivityIfEmpty() {
  const existing = await getActivity();
  if (existing.length > 0) return;

  const now = new Date();
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

  const makeDate = (daysAgo: number) => {
    const d = new Date(now.getTime() - daysAgo * 86400000);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}:00.000Z`;
  };

  const demo: ActivityItem[] = [
    {
      id: "demo-new-1",
      title: "Request assistance",
      placeName: "Iloilo Merchant Marine School",
      createdAt: makeDate(0),
      status: "pending",
    },
    {
      id: "demo-1",
      title: "Botong Bay Resort and Store",
      createdAt: makeDate(60),
      status: "accepted",
    },
    {
      id: "demo-2",
      title: "The Orchard Valley",
      createdAt: makeDate(46),
      status: "accepted",
    },
    {
      id: "demo-3",
      title: "RL Royal Prime Construction Company",
      createdAt: makeDate(40),
      status: "accepted",
    },
    {
      id: "demo-4",
      title: "Falsis Rice Mill",
      createdAt: makeDate(33),
      status: "accepted",
    },
    {
      id: "demo-5",
      title: "NKS Marketing - Leganes",
      createdAt: makeDate(31),
      status: "accepted",
    },
  ];

  await setActivity(demo);
}
