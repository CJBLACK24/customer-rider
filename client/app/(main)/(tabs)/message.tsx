/* eslint-disable @typescript-eslint/no-unused-vars */
// client/(main)/message.tsx
import { ScrollView, StyleSheet, View, Alert } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import Loading from "@/components/Loading";
import Button from "@/components/Button";
import ConversationItem from "@/components/ConversationItem";
import {
  getConversations,
  newConversation,
  deleteConversation,
  conversationDeleted as onConversationDeleted,
} from "@/socket/socketEvents";
import { ConversationProps, ResponseProps } from "@/types";
import { getSocket } from "@/socket/socket";

import ConversationActionsSheet from "@/components/ConversationActionsSheet";
import Animated, {
  FadeInDown,
  FadeInUp,
  LinearTransition,
} from "react-native-reanimated";

// 👇 NEW
import { callInvite } from "@/socket/socketEvents";

const sortByRecent = (a: ConversationProps, b: ConversationProps) => {
  const aDate = a?.lastMessage?.createdAt || a.createdAt;
  const bDate = b?.lastMessage?.createdAt || b.createdAt;
  return new Date(bDate).getTime() - new Date(aDate).getTime();
};

const Message = () => {
  const { signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<ConversationProps[]>([]);

  // sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ConversationProps | null>(null);

  useEffect(() => {
    getConversations(processConversations);
    newConversation(newConversationHandler);
    getConversations(null);
    return () => {
      getConversations(processConversations, true);
      newConversation(newConversationHandler, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      getConversations(null);
      return () => {};
    }, [])
  );

  // live updates: conversationUpdated + conversationDeleted
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onUpdated = (evt: any) => {
      if (!evt?.success || !evt?.data) return;
      setConversations((prev) => {
        const map = new Map(prev.map((c) => [c._id, c]));
        map.set(evt.data._id, evt.data);
        const arr = Array.from(map.values());
        arr.sort(sortByRecent);
        return arr;
      });
    };

    const onDeletedEvt = (evt: any) => {
      if (evt?.success && evt?.conversationId) {
        setConversations((prev) =>
          prev.filter((c) => c._id !== evt.conversationId)
        );
      }
    };

    socket.on("conversationUpdated", onUpdated);
    socket.on("conversationDeleted", onDeletedEvt);

    return () => {
      socket.off("conversationUpdated", onUpdated);
      socket.off("conversationDeleted", onDeletedEvt);
    };
  }, []);

  const processConversations = (res: ResponseProps) => {
    if (res.success) {
      const arr = [...res.data].sort(sortByRecent);
      setConversations(arr);
    }
  };

  const newConversationHandler = (res: ResponseProps) => {
    if (res.success && res.data?.isNew) {
      setConversations((prev) => {
        const arr = [...prev, res.data].sort(sortByRecent);
        return arr;
      });
    }
  };

  const openSheet = (item: ConversationProps) => {
    setSelected(item);
    setSheetOpen(true);
  };

  const handleVideoCall = () => {
    if (!selected) return;
    setSheetOpen(false);

    // 👇 1) Signal the other device(s) first
    callInvite({
      conversationId: selected._id,
      channel: selected._id, // using conversationId as agora channel
      kind: "video",
    });

    // 👇 2) Navigate caller into call screen immediately
    router.push({
      pathname: "/(main)/call",
      params: {
        channel: selected._id,
        name:
          selected.type === "direct"
            ? selected.participants.find((p) => p._id)?.name
            : selected.name || "Group",
      },
    });
  };

  const handleDelete = () => {
    if (!selected) return;
    Alert.alert(
      "Delete conversation",
      "This will delete all messages for everyone. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            deleteConversation({
              conversationId: selected._id,
              cb: (res) => {
                if (!res.success)
                  Alert.alert("Error", res.msg || "Failed to delete");
                setSheetOpen(false);
              },
            }),
        },
      ]
    );
  };

  return (
    <ScreenWrapper style={{ paddingTop: 0, backgroundColor: "#121217" }}>
      <View style={styles.container}>
        <Animated.View
          entering={FadeInDown.duration(180)}
          style={styles.topBar}
        >
          <View style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <Typo size={32} fontFamily="Candal" style={{ lineHeight: 34 }}>
              <Typo size={32} fontFamily="Candal" color={colors.primary}>
                patch
              </Typo>{" "}
              <Typo size={32} fontFamily="Candal" color={colors.white}>
                up
              </Typo>
            </Typo>

            <Typo
              size={20}
              fontWeight="800"
              color={colors.white}
              style={{ marginTop: 15 }}
            >
              Chats
            </Typo>
          </View>

          <Button
            style={styles.floatingButton}
            onPress={() =>
              router.push({
                pathname: "/(main)/newConversationModal",
                params: { isGroup: 0 },
              })
            }
          >
            <Icons.PlusIcon
              color={"#121217"}
              weight="bold"
              size={verticalScale(24)}
            />
          </Button>
        </Animated.View>

        <View style={styles.content}>
          <ScrollView
            showsHorizontalScrollIndicator={false}
            overScrollMode="never"
            contentContainerStyle={{ paddingVertical: spacingY._10 }}
          >
            <Animated.View
              layout={LinearTransition.springify().damping(18).stiffness(220)}
              style={styles.conversationList}
            >
              {conversations.map((item: ConversationProps, index) => (
                <Animated.View
                  key={(item as any)._id || `${item.type}-${index}`}
                  entering={FadeInUp.duration(180).delay(index * 30)}
                >
                  <ConversationItem
                    item={item}
                    router={router}
                    showDivider={false}
                    onLongPress={openSheet}
                  />
                  {index !== conversations.length - 1 && (
                    <View style={styles.divider} />
                  )}
                </Animated.View>
              ))}
            </Animated.View>

            {!loading && conversations.length === 0 && (
              <Typo
                color={colors.white}
                fontFamily="InterLight"
                style={{ textAlign: "center", marginTop: spacingY._20 }}
              >
                No chats yet
              </Typo>
            )}

            {loading && <Loading />}
          </ScrollView>
        </View>
      </View>

      <ConversationActionsSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onVideoCall={handleVideoCall}
        onDelete={handleDelete}
      />
    </ScreenWrapper>
  );
};

export default Message;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D" },
  topBar: {
    paddingHorizontal: spacingX._20,
    paddingTop: spacingY._15,
    paddingBottom: spacingY._10,
  },
  content: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    paddingHorizontal: spacingX._15,
  },
  conversationList: { paddingVertical: spacingY._10 },
  divider: { height: 1, backgroundColor: "#2B2D31", marginVertical: 8 },
  floatingButton: {
    height: verticalScale(30),
    width: verticalScale(30),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(10),
    right: verticalScale(30),
    backgroundColor: colors.white,
  },
});
