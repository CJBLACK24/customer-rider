import { getSocket } from "./socket";
import { ResponseProps } from "@/types";

function wire(event: string, payload: any, off: boolean = false) {
  const socket = getSocket();
  if (!socket) {
    console.log("Socket is not connected");
    return;
  }
  if (off) socket.off(event, payload);
  else if (typeof payload === "function") socket.on(event, payload);
  else socket.emit(event, payload);
}

/* ===== EXISTING EVENTS (unchanged) ===== */
export const testSocket = (payload: any, off: boolean = false) =>
  wire("testSocket", payload, off);
export const updateProfile = (payload: any, off: boolean = false) =>
  wire("updateProfile", payload, off);
export const getContacts = (payload: any, off: boolean = false) =>
  wire("getContacts", payload, off);
export const newConversation = (payload: any, off: boolean = false) =>
  wire("newConversation", payload, off);
export const getConversations = (payload: any, off: boolean = false) =>
  wire("getConversations", payload, off);
export const getMessages = (payload: any, off: boolean = false) =>
  wire("getMessages", payload, off);
export const newMessage = (payload: any, off: boolean = false) =>
  wire("newMessage", payload, off);
export const markAsRead = (payload: string, off: boolean = false) =>
  wire("markAsRead", payload, off);
export const conversationUpdated = (payload: any, off: boolean = false) =>
  wire("conversationUpdated", payload, off);

/** Kept for backwards-compat (direct emit) */
export const assistRequest = (payload: any, off: boolean = false) =>
  wire("assistRequest", payload, off);

export const registerPushToken = (
  payload: { token: string },
  off: boolean = false
) => wire("registerPushToken", payload, off);
export const messageDelivered = (payload: any, off: boolean = false) =>
  wire("messageDelivered", payload, off);

export const deleteConversation = (params: {
  conversationId: string;
  cb?: (res: ResponseProps) => void;
}) => {
  const socket = getSocket();
  if (!socket) return;
  const listener = (res: ResponseProps) => {
    params.cb?.(res);
    socket.off("deleteConversation", listener);
  };
  socket.on("deleteConversation", listener);
  socket.emit("deleteConversation", params.conversationId);
};
export const conversationDeleted = (payload: any, off: boolean = false) =>
  wire("conversationDeleted", payload, off);

/** ===== CALL SIGNALING (existing) ===== */
export const callInvite = (payload: {
  conversationId: string;
  channel: string;
  kind?: "video" | "audio";
  from?: { id: string; name?: string; avatar?: string };
}) => wire("call:invite", payload);
export const onCallIncoming = (cb: (evt: any) => void, off = false) =>
  wire("call:incoming", cb, off);
export const callAccept = (payload: {
  conversationId: string;
  channel: string;
}) => wire("call:accept", payload);
export const callReject = (payload: {
  conversationId: string;
  channel: string;
}) => wire("call:reject", payload);
export const callCancel = (payload: {
  conversationId: string;
  channel: string;
}) => wire("call:cancel", payload);
export const onCallAccepted = (cb: (evt: any) => void, off = false) =>
  wire("call:accepted", cb, off);
export const onCallRejected = (cb: (evt: any) => void, off = false) =>
  wire("call:rejected", cb, off);
export const onCallCancelled = (cb: (evt: any) => void, off = false) =>
  wire("call:cancelled", cb, off);

/* ===================== Assist (Customer) ===================== */
/**
 * Emits the correct payload for your server:
 * {
 *   vehicle: { model, plate, notes },
 *   location: { lat, lng, address?, accuracy? }
 * }
 *
 * NOTE: The server snapshots the sender's current profile
 * (customerName/email/phone) into the Assist Request automatically.
 */
export const assistCreate = (
  payload: {
    vehicle: { model: string; plate: string; notes?: string };
    location: { lat: number; lng: number; accuracy?: number; address?: string };
  },
  cb?: (ack: any) => void
) => {
  const socket = getSocket();
  if (!socket) return;

  if (cb) {
    const once = (res: any) => {
      cb(res);
      socket.off("assistRequest", once);
    };
    socket.on("assistRequest", once);
  }

  // Legacy event used by your server; also emits future-proof alias
  socket.emit("assistRequest", payload);
  socket.emit("assist:create", payload);
};

export const onAssistApproved = (cb: (evt: any) => void, off = false) =>
  wire("assist:approved", cb, off);
export const onAssistStatus = (cb: (evt: any) => void, off = false) =>
  wire("assist:status", cb, off);

export const assistStatus = (payload: any) => wire("assist:status", payload);
export const assistCancel = (payload: any) => wire("assist:cancel", payload);
export const assistDetails = (payload: any) => wire("assist:details", payload);
