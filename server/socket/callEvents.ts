// server/socket/callEvents.ts
import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation";

type InvitePayload = {
  conversationId: string;
  channel: string;            // we use conversationId as the agora channel
  kind?: "video" | "audio";   // default: video
  from?: { id: string; name?: string; avatar?: string };
};

type SimpleAck = {
  conversationId: string;
  channel: string;
};

export function registerCallEvents(io: SocketIOServer, socket: Socket) {
  // Caller invites others in the conversation
  socket.on("call:invite", async (data: InvitePayload) => {
    try {
      const { conversationId, channel, kind = "video" } = data || {};
      const callerId = String((socket.data as any)?.userId || "");
      if (!callerId || !conversationId || !channel) {
        return socket.emit("call:invite", { success: false, msg: "Invalid payload" });
      }

      const convo = await Conversation.findById(conversationId)
        .select("participants name avatar type")
        .lean();
      if (!convo) {
        return socket.emit("call:invite", { success: false, msg: "Conversation not found" });
      }
      const targetIds = (convo.participants || [])
        .map(String)
        .filter((pid) => pid !== callerId);

      const payload = {
        success: true,
        data: {
          conversationId,
          channel,
          kind,
          from: data.from || {
            id: callerId,
            name: (socket.data as any)?.name,
            avatar: (socket.data as any)?.avatar || "",
          },
          name: convo.type === "group" ? (convo.name || "Group") : undefined,
          ts: Date.now(),
        },
      };

      // Notify only the *other* participants
      for (const [sid, s] of io.sockets.sockets) {
        const uid = String((s.data as any)?.userId || "");
        if (targetIds.includes(uid)) io.to(sid).emit("call:incoming", payload);
      }

      // Ack caller so UI can show "ringing"
      socket.emit("call:invite", { success: true });
    } catch (e) {
      console.error("call:invite error:", e);
      socket.emit("call:invite", { success: false, msg: "Failed to send invite" });
    }
  });

  // Callee accepts -> tell everyone else in the conversation
  socket.on("call:accept", async (data: SimpleAck) => {
    try {
      const { conversationId, channel } = data || {};
      const userId = String((socket.data as any)?.userId || "");
      if (!userId || !conversationId || !channel) return;

      const convo = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      if (!convo) return;

      const targetIds = (convo.participants || [])
        .map(String)
        .filter((pid) => pid !== userId);

      const payload = {
        success: true,
        data: { conversationId, channel, by: userId, ts: Date.now() },
      };

      for (const [sid, s] of io.sockets.sockets) {
        const uid = String((s.data as any)?.userId || "");
        if (targetIds.includes(uid)) io.to(sid).emit("call:accepted", payload);
      }
    } catch (e) {
      console.error("call:accept error:", e);
    }
  });

  socket.on("call:reject", async (data: SimpleAck) => {
    try {
      const { conversationId, channel } = data || {};
      const userId = String((socket.data as any)?.userId || "");
      if (!userId || !conversationId || !channel) return;
      const convo = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      if (!convo) return;
      const targetIds = (convo.participants || [])
        .map(String)
        .filter((pid) => pid !== userId);

      const payload = {
        success: true,
        data: { conversationId, channel, by: userId, ts: Date.now() },
      };

      for (const [sid, s] of io.sockets.sockets) {
        const uid = String((s.data as any)?.userId || "");
        if (targetIds.includes(uid)) io.to(sid).emit("call:rejected", payload);
      }
    } catch (e) {
      console.error("call:reject error:", e);
    }
  });

  // Caller cancels the ringing screen
  socket.on("call:cancel", async (data: SimpleAck) => {
    try {
      const { conversationId, channel } = data || {};
      const userId = String((socket.data as any)?.userId || "");
      if (!userId || !conversationId || !channel) return;
      const convo = await Conversation.findById(conversationId)
        .select("participants")
        .lean();
      if (!convo) return;
      const targetIds = (convo.participants || [])
        .map(String)
        .filter((pid) => pid !== userId);

      const payload = {
        success: true,
        data: { conversationId, channel, by: userId, ts: Date.now() },
      };

      for (const [sid, s] of io.sockets.sockets) {
        const uid = String((s.data as any)?.userId || "");
        if (targetIds.includes(uid)) io.to(sid).emit("call:cancelled", payload);
      }
    } catch (e) {
      console.error("call:cancel error:", e);
    }
  });
}
