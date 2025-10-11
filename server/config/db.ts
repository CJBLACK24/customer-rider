import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

/**
 * Force the DB name to "CUSTOMER" from code.
 * You can override with MONGO_DB_NAME in .env if you ever need to:
 *   MONGO_DB_NAME=SomeOtherDb
 */
const DB_NAME = process.env.MONGO_DB_NAME || "customer";

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGO_URI as string;
    if (!uri) throw new Error("MONGO_URI is not set");

    // ✅ Pick the database explicitly to avoid the default "test"
    await mongoose.connect(uri, { dbName: DB_NAME });

    const conn = mongoose.connection;
    conn.on("connected", () => {
      console.log(`MongoDB connected to database "${DB_NAME}"`);
    });
    conn.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });
  } catch (error) {
    console.log("mongoDB connection error", error);
    throw error;
  }
};

export default connectDB;
