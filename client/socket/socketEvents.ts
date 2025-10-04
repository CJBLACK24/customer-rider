// client/socket/socketEvents.ts
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
export const assistRequest = (payload: any, off: boolean = false) =>
  wire("assistRequest", payload, off);
export const registerPushToken = (
  payload: { token: string },
  off: boolean = false
) => wire("registerPushToken", payload, off);
export const messageDelivered = (payload: any, off: boolean = false) =>
  wire("messageDelivered", payload, off);

// one-time ack pattern stays the same
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

// server -> client broadcast when *any* participant deletes
export const conversationDeleted = (payload: any, off: boolean = false) =>
  wire("conversationDeleted", payload, off);

/** 👇👇👇 NEW: CALL SIGNALING 👇👇👇 */
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
