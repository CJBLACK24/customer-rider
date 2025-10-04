// app/(main)/conversation.tsx
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useAuth } from "@/contexts/authContext";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import BackButton from "@/components/BackButton";
import Avatar from "@/components/Avatar";
import * as Icons from "phosphor-react-native";
import MessageItem from "@/components/MessageItem";
import Input from "@/components/Input";
import * as ImagePicker from "expo-image-picker";
import Loading from "@/components/Loading";
import { uploadFileToCloudinary } from "@/services/imageService";
import { MessageProps } from "@/types";
import { getMessages, newMessage, markAsRead } from "@/socket/socketEvents";

type ServerMessage = {
  _id: string;
  content?: string;
  attachment?: string | null;
  createdAt: string;
  senderId: { _id: string; name: string; avatar: string | null };
  conversationId?: string;
};

const Conversation = () => {
  const { user: currentUser } = useAuth();

  const {
    id: conversationId,
    name,
    participants: stringifiedParticipants,
    avatar,
    type,
  } = useLocalSearchParams();

  const conversationIdStr = useMemo(
    () => (conversationId ? String(conversationId) : ""),
    [conversationId]
  );

  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<{ uri: string } | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MessageProps[]>([]);

  const participants: any[] = useMemo(() => {
    if (typeof stringifiedParticipants !== "string") return [];
    try {
      const p = JSON.parse(stringifiedParticipants);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }, [stringifiedParticipants]);

  const isDirect =
    (typeof type === "string" && type === "direct") ||
    (typeof type !== "string" && participants.length === 2);

  const otherParticipant = isDirect
    ? participants.find((p: any) => String(p._id) !== String(currentUser?.id))
    : null;

  const conversationName =
    (isDirect && otherParticipant?.name) ||
    (typeof name === "string" && name) ||
    "Conversation";

  let conversationAvatar: string | null =
    (typeof avatar === "string" && avatar) || null;
  if (isDirect && otherParticipant?.avatar) {
    conversationAvatar = otherParticipant.avatar;
  }

  const toClientMessage = (m: ServerMessage): MessageProps => ({
    id: m._id,
    sender: {
      id: m.senderId?._id,
      name: m.senderId?.name,
      avatar: m.senderId?.avatar ?? null,
    },
    content: m.content ?? "",
    attachment: m.attachment ?? null,
    createdAt: m.createdAt,
    isMe: String(m.senderId?._id) === String(currentUser?.id),
  });

  useEffect(() => {
    const handleHistory = (res: any) => {
      if (res?.success && Array.isArray(res.data)) {
        const mapped = res.data.map((m: ServerMessage) => toClientMessage(m));
        setMessages(mapped);
      }
    };

    const handleNew = (res: any) => {
      if (res?.success && res.data) {
        const mapped = toClientMessage(res.data as ServerMessage);
        setMessages((prev) => [mapped, ...prev]);
      }
    };

    getMessages(handleHistory);
    newMessage(handleNew);
    if (conversationIdStr) getMessages(conversationIdStr);

    return () => {
      getMessages(handleHistory, true);
      newMessage(handleNew, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationIdStr, currentUser?.id]);

  const markCurrentAsRead = useCallback(() => {
    if (conversationIdStr) markAsRead(conversationIdStr);
  }, [conversationIdStr]);

  useFocusEffect(
    useCallback(() => {
      markCurrentAsRead();
      return () => {};
    }, [markCurrentAsRead])
  );

  const onPickFile = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      aspect: [4, 3],
      quality: 0.5,
    });
    if (!result.canceled) setSelectedFile(result.assets[0]);
  };

  const onSend = async () => {
    if (!message.trim() && !selectedFile) return;
    if (!currentUser || !conversationIdStr) return;

    setLoading(true);
    try {
      let attachment: string | null = null;

      if (selectedFile) {
        const uploadResult = await uploadFileToCloudinary(
          selectedFile,
          "message-attachments"
        );
        if (uploadResult.success) {
          attachment = uploadResult.data as string;
        } else {
          setLoading(false);
          Alert.alert("Error", "Could not send the Image!");
          return;
        }
      }

      newMessage({
        conversationId: conversationIdStr,
        content: message.trim(),
        attachment,
      });

      setMessage("");
      setSelectedFile(null);
      markCurrentAsRead();
    } catch (error) {
      console.log("Error sending message: ", error);
      Alert.alert("Error", "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper style={{ paddingTop: 0 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <Header
          style={styles.header}
          leftIcon={
            <View style={styles.headerLeft}>
              <BackButton />
              <Avatar
                size={40}
                uri={conversationAvatar || null}
                isGroup={!isDirect}
              />
              <Typo
                color={colors.white}
                fontFamily="InterLight"
                fontWeight={800}
                size={20}
              >
                {conversationName}
              </Typo>
            </View>
          }
          rightIcon={
            <TouchableOpacity style={{ marginBottom: verticalScale(7) }}>
              <Icons.DotsThreeOutlineVerticalIcon
                weight="fill"
                color={colors.white}
              />
            </TouchableOpacity>
          }
        />

        <View style={styles.content}>
          <FlatList
            data={messages}
            inverted
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.messageContent}
            renderItem={({ item }) => (
              <MessageItem
                item={item}
                isDirect={isDirect}
                conversationId={conversationIdStr}
                displayName={conversationName}
              />
            )}
            keyExtractor={(item) => item.id}
          />

          <View style={styles.footer}>
            <Input
              value={message}
              onChangeText={setMessage}
              containerStyle={{
                paddingLeft: spacingX._10,
                paddingRight: scale(65),
                borderWidth: 1.25,
                borderColor: colors.neutral600,
                borderRadius: 15,
              }}
              placeholder="Message..."
              icon={
                <TouchableOpacity style={styles.inputIcon} onPress={onPickFile}>
                  <Icons.PlusIcon
                    color={colors.black}
                    weight="bold"
                    size={verticalScale(22)}
                  />
                  {selectedFile?.uri && (
                    <Image
                      source={{ uri: selectedFile.uri }}
                      style={styles.selectedFile}
                    />
                  )}
                </TouchableOpacity>
              }
            />
            <View style={styles.inputRightIcon}>
              <TouchableOpacity style={styles.inputIcon} onPress={onSend}>
                {loading ? (
                  <Loading size="small" color={colors.black} />
                ) : (
                  <Icons.PaperPlaneTiltIcon
                    color={colors.black}
                    weight="fill"
                    size={verticalScale(22)}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Conversation;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacingX._15,
    paddingTop: spacingY._10,
    paddingBottom: spacingY._15,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._12,
  },
  inputRightIcon: {
    position: "absolute",
    right: scale(10),
    top: verticalScale(15),
    paddingLeft: spacingX._12,
    borderLeftWidth: 1.5,
    borderLeftColor: colors.neutral300,
  },
  selectedFile: {
    position: "absolute",
    height: verticalScale(38),
    width: verticalScale(38),
    borderRadius: 1000,
    alignSelf: "center",
  },
  content: {
    flex: 1,
    backgroundColor: colors.black,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderCurve: "continuous",
    overflow: "hidden",
    paddingHorizontal: spacingX._15,
  },
  inputIcon: {
    backgroundColor: colors.primary,
    borderRadius: 1000,
    padding: 8,
  },
  footer: {
    paddingTop: spacingX._7,
    paddingBottom: verticalScale(22),
  },
  messageContent: {
    paddingTop: spacingY._20,
    paddingBottom: spacingY._10,
    gap: spacingY._12,
  },
});
