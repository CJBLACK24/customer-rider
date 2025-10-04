// server/socket/socket.ts
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { Server as SocketIOServer, Socket } from "socket.io";
import { registerUserEvents } from "./userEvents";
import { registerChatEvents } from "./chatEvents";
import Conversation from "../modals/Conversation";
import { registerMessageEvents } from "./messageEvents";
import { registerAssistEvents } from "./assistEvents";
import { registerCallEvents } from "./callEvents"; // 👈 NEW

dotenv.config({ quiet: true });

export function initializeSocket(server: any): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: true,
      credentials: false,
    },
    pingTimeout: 25000,
    pingInterval: 20000,
  });

  io.use((socket: Socket, next) => {
    const token = (socket.handshake.auth as any)?.token;
    if (!token)
      return next(new Error(" Authentication error: no token provided"));
    jwt.verify(
      token,
      process.env.JWT_SECRET as string,
      (err: any, decoded: any) => {
        if (err) return next(new Error(" Authentication error: Invalid Token"));
        const userData = decoded.user;
        socket.data = userData;
        (socket.data as any).userId = userData.id;
        next();
      }
    );
  });

  io.on("connection", async (socket: Socket) => {
    const userId = (socket.data as any).userId;
    console.log(`User Connected: ${userId}, username: ${socket.data?.name}`);

    registerChatEvents(io, socket);
    registerUserEvents(io, socket);
    registerMessageEvents(io, socket);
    registerAssistEvents(io, socket);
    registerCallEvents(io, socket); // 👈 NEW

    try {
      const conversations = await Conversation.find({
        participants: userId,
      }).select("_id");
      conversations.forEach((c) => socket.join(String(c._id)));
    } catch (error: any) {
      console.log("Error joining conversation", error);
    }

    socket.on("disconnect", (reason) => {
      console.log(`user disconnected: ${userId} (${reason})`);
    });
  });

  return io;
}
