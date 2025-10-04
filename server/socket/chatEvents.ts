// server/socket/chatEvents.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";
import ConversationMeta from "../modals/ConversationMeta";
import Message from "../modals/Message";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {
  /** ================= getConversations ================= */
  socket.on("getConversations", async () => {
    try {
      const userId = socket.data.userId;
      if (!userId) {
        socket.emit("getConversations", {
          success: false,
          msg: "Unauthorized",
        });
        return;
      }

      const conversations = await Conversation.find({ participants: userId })
        .sort({ updatedAt: -1 })
        .populate({
          path: "lastMessage",
          select: "content senderId attachment createdAt conversationId",
        })
        .populate({ path: "participants", select: "name avatar email" })
        .lean();

      const convIds = conversations.map((c) => c._id);
      const metas = await ConversationMeta.find({
        conversationId: { $in: convIds },
        userId,
      })
        .select("conversationId unreadCount")
        .lean();

      const metaMap = new Map<string, number>();
      metas.forEach((m) =>
        metaMap.set(m.conversationId.toString(), m.unreadCount ?? 0)
      );

      const withUnread = conversations.map((c) => ({
        ...c,
        unreadCount: metaMap.get(c._id.toString()) ?? 0,
      }));

      socket.emit("getConversations", { success: true, data: withUnread });
    } catch (error: any) {
      console.log("getConversations error:", error);
      socket.emit("getConversations", {
        success: false,
        msg: "Failed to fetch conversations",
      });
    }
  });

  /** ================= newConversation ================= */
  socket.on("newConversation", async (data) => {
    try {
      if (data.type == "direct") {
        const existingConversation = await Conversation.findOne({
          type: "direct",
          participants: { $all: data.participants, $size: 2 },
        })
          .populate({ path: "participants", select: "name avatar email" })
          .lean();

        if (existingConversation) {
          socket.emit("newConversation", {
            success: true,
            data: { ...existingConversation, isNew: false, unreadCount: 0 },
          });
          return;
        }
      }

      const conversation = await Conversation.create({
        type: data.type,
        participants: data.participants,
        name: data.name || "",
        avatar: data.avatar || "",
        createdBy: socket.data.userId,
      });

      await Promise.all(
        data.participants.map((uid: string) =>
          ConversationMeta.findOneAndUpdate(
            { conversationId: conversation._id, userId: uid },
            { $setOnInsert: { unreadCount: 0 } },
            { upsert: true, new: true }
          )
        )
      );

      const connectedSockets = Array.from(io.sockets.sockets.values()).filter(
        (s) => data.participants.map(String).includes(String(s.data.userId))
      );
      connectedSockets.forEach((s) => s.join(conversation._id.toString()));

      const populatedConversation = await Conversation.findById(
        conversation._id
      )
        .populate({ path: "participants", select: "name avatar email" })
        .lean();

      const payload = { ...populatedConversation, isNew: true, unreadCount: 0 };

      connectedSockets.forEach((s) =>
        s.emit("newConversation", { success: true, data: payload })
      );
    } catch (error: any) {
      console.log("newConversation error:", error);
      socket.emit("newConversation", {
        success: false,
        msg: "failed to created conversation",
      });
    }
  });

  /** ================= deleteConversation ================= */
  socket.on("deleteConversation", async (conversationId: string) => {
    try {
      const userId = String(socket.data.userId || "");
      if (!userId)
        return socket.emit("deleteConversation", {
          success: false,
          msg: "Unauthorized",
        });

      const convo = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      if (!convo)
        return socket.emit("deleteConversation", {
          success: false,
          msg: "Conversation not found",
        });

      const isParticipant = convo.participants.map(String).includes(userId);
      if (!isParticipant)
        return socket.emit("deleteConversation", {
          success: false,
          msg: "Forbidden",
        });

      // hard delete messages + meta + conversation
      await Message.deleteMany({ conversationId });
      await ConversationMeta.deleteMany({ conversationId });
      await Conversation.findByIdAndDelete(conversationId);

      // notify every connected participant and make them leave the room
      const participantIds = convo.participants.map(String);

      for (const [sid, s] of io.sockets.sockets) {
        const uid = String(s.data?.userId || "");
        if (participantIds.includes(uid)) {
          s.leave(conversationId);
          io.to(sid).emit("conversationDeleted", {
            success: true,
            conversationId,
          });
        }
      }

      // ack the requester
      socket.emit("deleteConversation", { success: true });
    } catch (e) {
      console.error("deleteConversation error:", e);
      socket.emit("deleteConversation", {
        success: false,
        msg: "Failed to delete conversation",
      });
    }
  });
}
