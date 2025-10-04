// server/socket/assistEvents.ts
import { Server as SocketIOServer, Socket } from "socket.io";

/**
 * registerAssistEvents
 * - Client emits: "assistRequest" with the payload
 * - Server re-broadcasts to a shared room "operators" (and back to sender as ack)
 *
 * Later you can:
 *  - add DB persistence,
 *  - dispatch to nearest operator by coords,
 *  - create per-request rooms, etc.
 */
export function registerAssistEvents(io: SocketIOServer, socket: Socket) {
  socket.on("assistRequest", async (data) => {
    try {
      const enriched = {
        ...data,
        serverTs: new Date().toISOString(),
        byUser: socket.data?.userId ?? null,
      };

      // Send ack to requester
      socket.emit("assistRequest", { success: true, data: enriched });

      // Broadcast to operators room (for future operator app)
      io.to("operators").emit("assistRequest", { success: true, data: enriched });
    } catch (err) {
      console.error("assistRequest error:", err);
      socket.emit("assistRequest", { success: false, msg: "Failed to dispatch request" });
    }
  });

  /**
   * Allow any client to join operators room (temporary).
   * When you build the operator side, only operator accounts should join.
   */
  socket.on("joinOperators", () => {
    socket.join("operators");
  });
}
