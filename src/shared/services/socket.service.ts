import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { JwtService } from "./jwt.service";
import { AppError } from "../../core/errors/AppError";

export class SocketService {
  private static io: SocketIOServer;
  private static userSockets = new Map<string, string>(); // Maps userId to socketId

  static initialize(httpServer: HttpServer): void {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*", // Configure based on your env
        methods: ["GET", "POST"],
      },
    });

    const jwtService = new JwtService();

    // Socket Authentication Middleware
    this.io.use((socket, next) => {
      try {
        console.log("socket:" + socket);
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication error"));

        const decoded = jwtService.verify<{ userId: string }>(token, false);
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error("Authentication error"));
      }
    });

    this.io.on("connection", (socket: Socket) => {
      const userId = socket.data.userId;
      this.userSockets.set(userId, socket.id);

      console.log(`User connected: ${userId} (Socket: ${socket.id})`);

      socket.on("disconnect", () => {
        this.userSockets.delete(userId);
        console.log(`User disconnected: ${userId}`);
      });
    });
  }

  static getIO(): SocketIOServer {
    if (!this.io) {
      throw new Error("Socket.io not initialized!");
    }
    return this.io;
  }

  static sendToUser(userId: string, event: string, data: any): void {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}
