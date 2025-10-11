// server/index.ts
import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db";
import authRoutes from "./routes/auth.routes";
import { initializeSocket } from "./socket/socket";
import assistRoutes from "./routes/assist.routes"; 

dotenv.config({ quiet: true });

const app = express();

app.use(express.json());

// Open CORS for development (React Native doesn’t enforce CORS,
// but allowing any origin avoids surprises as your IP changes)
app.use(
  cors({
    origin: true, // reflect request origin (dynamic)
    credentials: false, // you don't use cookies
  })
);


app.use("/auth", authRoutes);
app.use("/assist", assistRoutes); 
app.get("/", (_req, res) => {
  res.send("Server is running");
});

const PORT = Number(process.env.PORT || 3000);
const server = http.createServer(app);

// Socket.io
initializeSocket(server);

connectDB()
  .then(() => {
    console.log("Database Connected");
    // IMPORTANT: listen on all interfaces so your phone (same LAN) can reach it
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on http://0.0.0.0:${PORT}`);
    });
  })
  .catch((error) => {
    console.log(
      "Failed to start server due to database connection error",
      error
    );
  });
