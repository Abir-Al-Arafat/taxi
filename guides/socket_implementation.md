# Messaging Module: Socket Implementation Guide

This document outlines the architecture, setup, and testing procedures for the real-time socket communication within the Messaging module.

## 1. How It Works

The real-time messaging system is decoupled into two main parts: the core business logic and the real-time event emitter.

- **Socket Service:** The core real-time communication is managed by the `SocketService` located at `src/shared/services/socket.service.ts`[cite: 1]. This service initializes the WebSocket server, manages client connections, and handles joining rooms (usually based on user IDs or ride IDs).
- **Message Module:** The business logic for chat resides in `src/modules/message/`[cite: 1].
  - When a user sends a message, it typically goes through `message.controller.ts` or directly through a socket event[cite: 1].
  - The `message.service.ts` processes the message, and `message.repository.ts` saves it to the database[cite: 1].
  - Once saved, the `SocketService` is triggered to emit the payload to the intended recipient's active socket connection.

---

## 2. How to Setup

To ensure sockets are running correctly in your local or production environment, follow these steps:

### A. Server Initialization

The socket server is initialized and attached to the main HTTP server. This binding happens during the application startup phase, located within `src/server.ts` or `src/app.ts`[cite: 1].

- **Action:** Ensure that your environment variables (managed via `src/config/env.ts`) are properly configured with the correct `PORT`[cite: 1].

### B. Client Connection & Authentication

Clients (mobile or web) must connect to the WebSocket URL (e.g., `ws://localhost:<PORT>`).

- **Authentication:** Because this is a secure application, the socket connection requires authentication. Clients must pass their JWT token (managed by `src/shared/services/jwt.service.ts`) either in the connection handshake headers or the query string, depending on your exact socket library configuration[cite: 1].
- **User Mapping:** Upon a successful connection, the `SocketService` decodes the token, extracts the User ID, and places the user's socket into a dedicated "room" named after their User ID[cite: 1]. This allows for private, direct messaging.

---

## 3. How to Check and Test the Socket

You can test the socket implementation using Postman (which supports WebSockets/Socket.io) or a web client like Hopscotch.

### Step 1: Establish a Connection

1. Open Postman and create a new **WebSocket Request** (or Socket.io request, depending on your library).
2. Enter the server URL (e.g., `http://localhost:5000/`).
3. In the **Headers** tab, provide the user's JWT token (e.g., `token: <your_jwt_token>`).
4. Click **Connect**.

### Step 2: Listen for Incoming Messages

To verify that the user can receive messages, you need to listen to the specific event emitted by `src/shared/services/socket.service.ts`[cite: 1].

1. In Postman, add an event listener for `newMessage` (or your specific event name based on the `socket.service.ts` configuration).

2. Keep this connection open.

### Step 3: Trigger a Message (Test Emission)

You can test the message delivery by triggering the message creation flow.

1. Open a standard HTTP request tab in Postman.
2. Send a `POST` request to the message creation endpoint defined in `src/modules/message/message.route.ts`[cite: 1].
3. Ensure the payload passes the validation rules defined in `src/modules/message/message.validators.ts`[cite: 1].
4. **Result:** Once the API returns a success response, check your WebSocket tab. You should see the new message payload instantly appear under your `newMessage` listener.
