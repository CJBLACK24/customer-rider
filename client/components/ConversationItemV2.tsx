import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Avatar from "./Avatar";
import Typo from "./Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { ConversationListItemProps } from "@/types";

function formatRelative(ts?: string) {
  if (!ts) return "";
  const now = Date.now();
  const t = new Date(ts).getTime();
  const diff = Math.max(0, now - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "now";
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  return `${d}d`;
}

export default function ConversationItemV2({
  item,
  showDivider,
  router,
}: ConversationListItemProps) {
  const title =
    item.type === "group"
      ? item.name || "Group"
      : item.participants.find((p) => p._id)?.name || "Direct";

  const avatar =
    item.type === "group"
      ? item.avatar || ""
      : item.participants.find((p) => p._id)?.avatar || "";

  const unread = item.unreadCount ?? 0;
  const rel = formatRelative(item.lastMessage?.createdAt || item.updatedAt);
  const hasUnread = unread > 0;
  const badgeText = unread > 9 ? "9+" : unread > 0 ? `${unread}` : "";

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() =>
        router.push({
          pathname: "/(main)/conversation",
          params: {
            id: item._id,
            name: item.name || "",
            avatar: item.avatar || "",
            type: item.type,
            participants: JSON.stringify(item.participants),
          },
        })
      }
    >
      <Avatar size={45} uri={avatar} isGroup={item.type === "group"} />

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Typo
            size={15}
            fontFamily="InterLight"
            fontWeight={hasUnread ? "800" : undefined} // ← only bold InterLight when unread
            color={colors.white}
            style={{ flexShrink: 1 }}
          >
            {title}
          </Typo>
          <View style={{ marginLeft: "auto", alignItems: "flex-end" }}>
            <Typo size={12} color={colors.white} fontFamily="InterLight">
              {rel}
            </Typo>
            {hasUnread && <View style={styles.dot} />}
          </View>
        </View>

        <View style={{ marginTop: 4 }}>
          {hasUnread ? (
            <Typo size={13} color={colors.primary} fontFamily="InterLight">
              {badgeText} {unread > 1 ? "new messages" : "new message"}
            </Typo>
          ) : (
            <Typo size={13} color={colors.neutral200} fontFamily="InterLight">
              {item.lastMessage?.content || ""}
            </Typo>
          )}
        </View>
      </View>

      {showDivider && <View style={styles.divider} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._10,
    paddingVertical: spacingY._7,
  },
  divider: {
    height: 1,
    backgroundColor: "#333539ff",
    marginTop: spacingY._7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
    alignSelf: "flex-end",
  },
});
