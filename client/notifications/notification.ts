import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as FileSystem from "expo-file-system";
import Constants from "expo-constants";
import { Platform } from "react-native";

// Foreground behavior (iOS banners + list)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function isAndroidFcmConfigured(): boolean {
  const expoCfg = (Constants as any)?.expoConfig || {};
  const androidCfg = expoCfg?.android || {};
  return Boolean(androidCfg.googleServicesFile);
}

export async function ensureNotificationCategories() {
  try {
    await Notifications.setNotificationCategoryAsync("MESSAGE", [
      {
        identifier: "REPLY",
        buttonTitle: "Reply",
        textInput: { submitButtonTitle: "Send", placeholder: "Reply…" },
        options: { opensAppToForeground: true },
      },
      {
        identifier: "MARK_AS_READ",
        buttonTitle: "Mark as read",
        options: { opensAppToForeground: true },
      },
    ]);
  } catch (e) {
    console.log("ensureNotificationCategories error:", e);
  }
}

export async function registerForPushNotificationsAsync(): Promise<
  string | null
> {
  try {
    if (!Device.isDevice) {
      console.log("Push notifications require a physical device.");
      return null;
    }

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      console.log("Permission not granted for notifications.");
      return null;
    }

    if (Platform.OS === "android" && !isAndroidFcmConfigured()) {
      console.log(
        "Android push token skipped: FCM not configured. Foreground local notifications will still work."
      );
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: "default",
      });
      return null;
    }

    const projectId =
      (Constants as any)?.expoConfig?.extra?.eas?.projectId ||
      (Constants as any)?.easConfig?.projectId;

    const token = (await Notifications.getExpoPushTokenAsync({ projectId }))
      .data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lockscreenVisibility:
          Notifications.AndroidNotificationVisibility.PUBLIC,
        sound: "default",
      });
    }

    return token;
  } catch (e) {
    console.log("registerForPushNotificationsAsync error (non-fatal):", e);
    return null;
  }
}

function guessUti(
  urlOrName: string
): "public.png" | "public.jpeg" | "public.image" {
  const lower = urlOrName.split("?")[0].toLowerCase();
  if (lower.endsWith(".png")) return "public.png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "public.jpeg";
  return "public.image";
}

// Safely get a writable directory even if TS types are stale
function getWritableDir(): string | null {
  const fsAny = FileSystem as any;
  const candidate: string | undefined =
    (typeof fsAny.cacheDirectory === "string" && fsAny.cacheDirectory) ||
    (typeof fsAny.documentDirectory === "string" && fsAny.documentDirectory) ||
    undefined;
  if (!candidate) return null;
  return candidate.endsWith("/") ? candidate : candidate + "/";
}

async function prepareIosAvatarAttachment(
  avatarUrl: string
): Promise<Notifications.NotificationContentAttachmentIos | undefined> {
  try {
    const dir = getWritableDir();
    if (!dir) return undefined;

    const ext = avatarUrl.split("?")[0].split(".").pop() || "jpg";
    const fileName = `avatar_${Date.now()}.${ext}`;
    const dest = `${dir}${fileName}`;

    const { uri, status } = await FileSystem.downloadAsync(avatarUrl, dest);
    if (status !== 200 || !uri) return undefined;

    const uti = guessUti(fileName);
    return {
      identifier: "avatar",
      url: uri,
      type: uti,
    };
  } catch {
    return undefined;
  }
}

export async function showLocalMessageNotification(params: {
  senderName: string;
  preview: string;
  conversationId: string;
  avatarUrl?: string;
}) {
  const { senderName, preview, conversationId, avatarUrl } = params;

  let attachments: Notifications.NotificationContentAttachmentIos[] | undefined;
  if (Platform.OS === "ios" && avatarUrl) {
    const att = await prepareIosAvatarAttachment(avatarUrl);
    attachments = att ? [att] : undefined;
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: senderName,
        body: preview || "New message",
        sound: "default",
        categoryIdentifier: "MESSAGE",
        attachments, // iOS only
        data: {
          conversationId,
          name: senderName,
          type: "direct",
          avatar: avatarUrl,
        },
      },
      trigger: null,
    });
  } catch (e) {
    console.log("showLocalMessageNotification error:", e);
  }
}
