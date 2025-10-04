// client/components/NotificationBridge.tsx
import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import {
  AppState,
  AppStateStatus,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import { getSocket } from "@/socket/socket";
import {
  registerPushToken,
  newMessage,
  markAsRead,
  onCallIncoming,
  onCallCancelled,
  callAccept,
  callReject,
} from "@/socket/socketEvents";

import {
  registerForPushNotificationsAsync,
  showLocalMessageNotification,
  ensureNotificationCategories,
} from "../notifications/notification";

import Typo from "@/components/Typo";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";

type IncomingCall = {
  conversationId: string;
  channel: string;
  kind?: "video" | "audio";
  from?: { id: string; name?: string; avatar?: string };
  name?: string;
};

export default function NotificationBridge() {
  const { user } = useAuth();
  const router = useRouter();
  const appState = useRef<AppStateStatus>(AppState.currentState);

  // in-app ring modal
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);

  // Track foreground/background
  useEffect(() => {
    const sub = AppState.addEventListener(
      "change",
      (s) => (appState.current = s)
    );
    return () => sub.remove();
  }, []);

  // One-time: define notification actions (Reply / Mark as read)
  useEffect(() => {
    ensureNotificationCategories();
  }, []);

  // Register device token and send to server after login
  useEffect(() => {
    (async () => {
      if (!user) return;
      const token = await registerForPushNotificationsAsync();
      const socket = getSocket();
      if (token && socket) registerPushToken({ token });
    })();
  }, [user]);

  // Handle notification taps and quick actions
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(
      async (resp) => {
        const action = resp.actionIdentifier;
        const data = resp.notification.request.content.data || {};

        const conversationId = data.conversationId as string | undefined;
        const name = (data.name as string | undefined) || "Conversation";
        const avatar = (data.avatar as string | undefined) || "";
        const type = (data.type as "direct" | "group" | undefined) || "direct";
        const participants = (
          Array.isArray(data.participants) ? data.participants : []
        ) as Array<{
          _id: string;
          name: string;
          avatar: string;
        }>;

        if (!conversationId) return;

        if (action === "REPLY") {
          const text = (resp as any)?.userText?.trim?.() || "";
          if (text) newMessage({ conversationId, content: text });
        } else if (action === "MARK_AS_READ") {
          markAsRead(conversationId);
        }

        router.push({
          pathname: "/(main)/conversation",
          params: {
            id: conversationId,
            name,
            avatar,
            type,
            participants: JSON.stringify(participants),
          },
        });
      }
    );
    return () => sub.remove();
  }, [router]);

  // Foreground local toast on incoming messages (not sent by me)
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewMessage = (evt: any) => {
      if (!evt?.success || !evt?.data) return;
      const me = user?.id;
      const m = evt.data;

      if (
        appState.current === "active" &&
        String(m.senderId?._id || m.senderId) !== String(me)
      ) {
        const preview = m.attachment
          ? "Sent a photo"
          : m.content || "New message";
        const senderName = m.senderId?.name || "Someone";
        const senderAvatar = m.senderId?.avatar || "";
        showLocalMessageNotification({
          senderName,
          preview,
          conversationId: m.conversationId,
          avatarUrl: senderAvatar,
        });
      }
    };

    socket.on("newMessage", onNewMessage);
    return () => {
      socket.off("newMessage", onNewMessage);
    };
  }, [user]);

  // Local delivered toast for my own message delivery
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onDelivered = (evt: any) => {
      if (!evt?.success) return;
      const names: string[] = Array.isArray(evt.deliveredTo)
        ? evt.deliveredTo
        : [];
      const who = names.length ? names.join(", ") : "recipient";
      showLocalMessageNotification({
        senderName: "Delivered",
        preview: `Your message was delivered to ${who}`,
        conversationId: evt.conversationId,
      });
    };

    socket.on("messageDelivered", onDelivered);
    return () => {
      socket.off("messageDelivered", onDelivered);
    };
  }, []);

  // 🔔 CALL SIGNALING: listen for incoming invites / cancelled
  useEffect(() => {
    const handleIncoming = (evt: any) => {
      if (!evt?.success || !evt?.data) return;
      const data = evt.data as IncomingCall;
      // ignore my own invite (in case of echo)
      if (data?.from?.id && user?.id && data.from.id === user.id) return;
      setIncoming(data);
    };
    const handleCancelled = () => setIncoming(null);

    onCallIncoming(handleIncoming);
    onCallCancelled(handleCancelled);

    return () => {
      onCallIncoming(handleIncoming, true);
      onCallCancelled(handleCancelled, true);
    };
  }, [user?.id]);

  const accept = async () => {
    if (!incoming) return;
    await callAccept({
      conversationId: incoming.conversationId,
      channel: incoming.channel,
    });
    const title = incoming.name || incoming.from?.name || "Call";
    setIncoming(null);
    router.push({
      pathname: "/(main)/call",
      params: { channel: incoming.channel, name: title },
    });
  };

  const reject = async () => {
    if (!incoming) return;
    await callReject({
      conversationId: incoming.conversationId,
      channel: incoming.channel,
    });
    setIncoming(null);
  };

  return (
    <Modal
      visible={!!incoming}
      transparent
      animationType="fade"
      onRequestClose={() => setIncoming(null)}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Typo
            size={18}
            color={colors.white}
            fontFamily="InterLight"
            style={{ textAlign: "center" }}
          >
            Incoming {incoming?.kind === "audio" ? "audio" : "video"} call
          </Typo>
          <Typo
            size={22}
            color={colors.white}
            fontWeight="800"
            style={{ textAlign: "center", marginTop: 8 }}
          >
            {incoming?.from?.name || incoming?.name || "Unknown"}
          </Typo>

          <View style={styles.row}>
            <TouchableOpacity
              style={[styles.btn, styles.reject]}
              onPress={reject}
            >
              <Typo size={16} color="#fff" fontFamily="InterLight">
                Reject
              </Typo>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.accept]}
              onPress={accept}
            >
              <Typo size={16} color="#000" fontFamily="InterLight">
                Accept
              </Typo>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  sheet: {
    width: "82%",
    backgroundColor: colors.black,
    borderRadius: radius._20,
    padding: spacingX._15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacingY._15,
  },
  btn: {
    flex: 1,
    borderRadius: radius._15,
    paddingVertical: spacingY._10,
    alignItems: "center",
  },
  reject: { marginRight: spacingX._10, backgroundColor: "#E04040" },
  accept: { marginLeft: spacingX._10, backgroundColor: colors.primary },
});
