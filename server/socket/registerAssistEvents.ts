import { Server as SocketIOServer, Socket } from "socket.io";
import AssistRequest from "../modals/AssistRequest";
import Conversation from "../modals/Conversation";
import ConversationMeta from "../modals/ConversationMeta";
import User from "../modals/User";

/** Helpers */
async function ensureDirectConversation(io: SocketIOServer, a: string, b: string) {
  let convo = await Conversation.findOne({
    type: "direct",
    participants: { $all: [a, b], $size: 2 },
  })
    .populate({ path: "participants", select: "name avatar email" })
    .populate({
      path: "lastMessage",
      select: "content senderId attachment createdAt conversationId",
    })
    .lean();

  if (!convo) {
    const created = await Conversation.create({
      type: "direct",
      participants: [a, b],
      createdBy: a,
    });

    await Promise.all(
      [a, b].map((uid) =>
        ConversationMeta.findOneAndUpdate(
          { conversationId: created._id, userId: uid },
          { $setOnInsert: { unreadCount: 0 } },
          { upsert: true, new: true }
        )
      )
    );

    // join sockets to room
    for (const [sid, s] of io.sockets.sockets) {
      const uid = String((s.data as any)?.userId || "");
      if (uid === String(a) || uid === String(b)) s.join(created._id.toString());
    }

    convo = await Conversation.findById(created._id)
      .populate({ path: "participants", select: "name avatar email" })
      .populate({
        path: "lastMessage",
        select: "content senderId attachment createdAt conversationId",
      })
      .lean();

    const payload = { ...convo, isNew: true, unreadCount: 0 };
    for (const [sid, s] of io.sockets.sockets) {
      const uid = String((s.data as any)?.userId || "");
      if (uid === String(a) || uid === String(b)) {
        io.to(sid).emit("newConversation", { success: true, data: payload });
      }
    }
  }

  return convo!;
}

export function registerAssistEvents(io: SocketIOServer, socket: Socket) {
  /** Allow any client to observe operator room (temporary until roles are added) */
  socket.on("joinOperators", () => {
    socket.join("operators");
  });

  /** Legacy event (kept): assistRequest  → create request + ack + broadcast */
  socket.on("assistRequest", async (data: any) => {
    try {
      const requester = String((socket.data as any)?.userId || "");
      if (!requester) throw new Error("Unauthorized");

      const { vehicle = {}, location = {} } = data || {};
      const lat = Number(location.lat),
        lng = Number(location.lng);

      // Pull the authoritative user profile for snapshot
      const user = await User.findById(requester)
        .select("name avatar email phone")
        .lean();

      const doc = await AssistRequest.create({
        userId: requester,
        customerName: (user?.name || "").trim(),
        customerEmail: (user?.email || "").trim(),
        customerPhone: (user?.phone || "").trim(),
        vehicle,
        location: {
          type: "Point",
          coordinates: [isFinite(lng) ? lng : 0, isFinite(lat) ? lat : 0],
          address: location.address || "",
          accuracy: location.accuracy || undefined,
        },
        status: "pending",
      });

      // ack back to requester (compat)
      socket.emit("assistRequest", {
        success: true,
        data: { id: String(doc._id) },
      });

      // broadcast to operators with requester's minimal profile + snapshot name
      io.to("operators").emit("assist:created", {
        success: true,
        data: {
          id: String(doc._id),
          user: {
            id: requester,
            name: doc.customerName || user?.name || "",
            avatar: user?.avatar || "",
          },
          vehicle: doc.vehicle,
          location: { lat, lng, address: doc.location.address },
          createdAt: doc.createdAt,
        },
      });
    } catch (e) {
      console.error("assistRequest error:", e);
      socket.emit("assistRequest", {
        success: false,
        msg: "Failed to dispatch request",
      });
    }
  });

  /** New: assist:create (same as above but future-proof) */
  socket.on("assist:create", async (data: any) => {
    socket.emit("assistRequest", { success: true, msg: "accepted (compat)" });
    socket.emit("assist:create", { success: true }); // optional mini-ack
    socket.emit("assistRequest", data); // keep parity; real logic already run in handler above
  });

  /** Operator accepts a request */
  socket.on("assist:accept", async (data: { id: string }) => {
    try {
      const operatorId = String((socket.data as any)?.userId || "");
      const id = String(data?.id || "");
      if (!operatorId || !id)
        return socket.emit("assist:accept", {
          success: false,
          msg: "Invalid payload",
        });

      const req = await AssistRequest.findById(id);
      if (!req)
        return socket.emit("assist:accept", {
          success: false,
          msg: "Not found",
        });
      if (req.status !== "pending") {
        return socket.emit("assist:accept", {
          success: false,
          msg: "Already processed",
        });
      }

      req.status = "accepted";
      req.assignedTo = operatorId as any;
      await req.save();

      // Notify the requester (customer)
      for (const [sid, s] of io.sockets.sockets) {
        const uid = String((s.data as any)?.userId || "");
        if (uid === String(req.userId)) {
          io.to(sid).emit("assist:approved", {
            success: true,
            data: { id },
          });
        }
      }

      // Ensure a direct conversation and notify both ends
      await ensureDirectConversation(io, String(req.userId), operatorId);

      // ack operator
      socket.emit("assist:accept", { success: true, data: { id } });
    } catch (e) {
      console.error("assist:accept error:", e);
      socket.emit("assist:accept", {
        success: false,
        msg: "Failed to accept",
      });
    }
  });

  /** Optional status updates (complete/cancel) — stubs for future operator app */
  socket.on("assist:status", async (data: { id: string; status: string }) => {
    try {
      const id = String(data?.id || "");
      const status = String(data?.status || "");
      if (!["completed", "cancelled", "rejected"].includes(status)) return;

      const req = await AssistRequest.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).lean();
      if (!req) return;

      for (const [sid, s] of io.sockets.sockets) {
        const uid = String((s.data as any)?.userId || "");
        if (uid === String(req.userId)) {
          io.to(sid).emit("assist:status", {
            success: true,
            data: { id, status },
          });
        }
      }
    } catch (e) {
      console.error("assist:status error:", e);
    }
  });
}
