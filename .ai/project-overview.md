# SwiftRide Taxi Backend - Project Overview

## Project Purpose

SwiftRide is a **ride-sharing/taxi application** backend that manages booking, driver management, and transaction processing. The backend provides APIs for mobile/web clients to interact with ride services.

**Status**: Foundation stage - Core infrastructure in place, awaiting feature modules (Accounts, Transactions, Rides, Drivers, Users).

## Main Business Domains (Future Modules)

- **User Management**: Customer authentication and profiles
- **Driver Management**: Driver registration, verification, location tracking
- **Rides/Bookings**: Ride request, acceptance, tracking, completion
- **Transactions**: Payment processing, billing, wallet management
- **Ratings & Reviews**: User feedback system
- **Real-time Features**: Socket-based location updates, ride status

## Core Architecture Overview

### Layered Architecture Pattern

```
Client (Mobile/Web)
        ↓
   API Routes (/api/v1/*)
        ↓
   Controllers (Handle HTTP)
        ↓
   Services (Business Logic)
        ↓
   Repositories (Data Access)
        ↓
   MongoDB (Persistence)
```

### Key Architectural Principles

- **Service-Oriented**: Business logic isolated in services
- **Repository Pattern**: Data access abstraction layer
- **Error-First Design**: Centralized error handling with AppError
- **Response Standardization**: Consistent API response format via ResponseBuilder
- **Async/Await Wrapper**: Centralized promise handling via asyncHandler
- **Environment Configuration**: Centralized config management
- **Middleware Pipeline**: Pre/post-request processing

## Tech Stack

### Core

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js 5.2.1
- **Language**: TypeScript 6.0.2
- **Package Manager**: npm

### Database

- **Primary DB**: MongoDB (Mongoose 9.4.1 ODM)
- **Transactions**: MongoDB Sessions (for ACID transactions)

### Dev Tools

- **Build**: TypeScript Compiler (tsc)
- **Dev Runner**: tsx (TypeScript executor with watch mode)
- **Type Definitions**: @types/node, @types/express, @types/cors

### Utilities

- **CORS**: cors 2.8.6 (Cross-origin resource sharing)
- **Environment**: dotenv 17.4.1 (Environment variable management)

## Important Dependencies & Usage

| Dependency | Version | Purpose           | Usage                             |
| ---------- | ------- | ----------------- | --------------------------------- |
| express    | 5.2.1   | Web framework     | `import express from 'express'`   |
| mongoose   | 9.4.1   | MongoDB ODM       | `import mongoose from 'mongoose'` |
| typescript | 6.0.2   | Type system       | Compile via `tsc`                 |
| tsx        | 4.21.0  | Dev runner        | `tsx watch src/server.ts`         |
| cors       | 2.8.6   | CORS middleware   | `app.use(cors())`                 |
| dotenv     | 17.4.1  | Config management | `dotenv.config()`                 |

## Application Flow Overview

### 1. Server Bootstrap (server.ts → app.ts)

```
server.ts (entry point)
├── Load environment variables (env.ts)
├── Connect to MongoDB (database.ts)
├── Initialize Express app (app.ts)
├── Start listening on port
└── Log startup message
```

### 2. Request Processing Pipeline

```
Incoming Request
├── CORS Middleware
├── JSON Body Parser
├── Route Match (/api/v1/*)
├── Controller Handler
├── Service Logic
├── Repository Query
├── Response Builder
└── Response Sent
```

### 3. Error Handling Flow

```
Sync Error → Try/Catch
Async Error → asyncHandler() wrapper
      ↓
AppError (operational errors)
Non-AppError (programming errors)
      ↓
errorMiddleware (global error handler)
      ↓
ResponseBuilder.failure() → Client
```

## API Versioning Strategy

- **Current Version**: v1
- **URL Pattern**: `/api/v1/<resource>/<action>`
- **Future**: Support multiple API versions simultaneously if needed

## Database Connection Strategy

- **Connection String**: Via `DATABASE_URL` environment variable
- **Connection Pattern**: Singleton (one connection instance)
- **Mongoose Schema**: ODM for type safety
- **Sessions**: Support for ACID transactions via ClientSession

## Port Configuration

- **Default Port**: 5000
- **Override**: Via `PORT` environment variable
- **Current**: http://localhost:5000
- **Health Check**: GET `/` returns `{ success: true, message: "Server is running" }`

## Development Scripts

```bash
npm run dev      # Start dev server with file watching (tsx watch)
npm run build    # Compile TypeScript to dist/ folder
npm start        # Run compiled JavaScript from dist/
npm test         # Placeholder for testing (to be implemented)
```

## File Output Structure

- **Source**: `src/` (TypeScript)
- **Compiled**: `dist/` (JavaScript)
- **Execution**: `npm start` runs `dist/server.js`
