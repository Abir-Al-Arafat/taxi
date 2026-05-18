import mongoose from "mongoose";
import { env } from "./env";

class Database {
  async connect(): Promise<void> {
    await mongoose.connect(env.databaseUrl);
    console.log("MongoDB connected successfully");
  }
}

export const database = new Database();
