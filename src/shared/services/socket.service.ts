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
        console.log("socket.handshake:" + JSON.stringify(socket.handshake));
        console.log(
          "socket.handshake.auth:" + JSON.stringify(socket.handshake.auth),
        );
        console.log(
          "socket.handshake.auth.token:" +
            JSON.stringify(socket.handshake.auth.token),
        );
        // 1. Get token from the standard auth payload || get token from headers
        const token =
          socket.handshake.auth?.token || socket.handshake.headers.token;

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

      // 1. Join a dedicated room for the active ride
      socket.on("joinRideRoom", (rideId: string) => {
        const roomName = `ride_${rideId}`;
        socket.join(roomName);
        console.log(`Socket ${socket.id} joined room: ${roomName}`);
      });

      // 2. Listen for location updates and broadcast to the room
      socket.on(
        "sendLocation",
        (data: {
          rideId: string;
          lat: number;
          lng: number;
          role: "driver" | "rider";
          encodedRoute: string;
          address: string;
        }) => {
          const roomName = `ride_${data.rideId}`;

          // socket.to().emit broadcasts to everyone in the room EXCEPT the sender
          socket.to(roomName).emit("receiveLocation", {
            lat: data.lat,
            lng: data.lng,
            role: data.role,
            timestamp: new Date(),
            encodedRoute: data.encodedRoute,
            address: data.address,
          });
        },
      );

      // 3. Leave the room when the ride is over
      socket.on("leaveRideRoom", (rideId: string) => {
        const roomName = `ride_${rideId}`;
        socket.leave(roomName);
        console.log(`Socket ${socket.id} left room: ${roomName}`);
      });

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
