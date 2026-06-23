import { createServer } from "http";
import { database } from "./config/database";
import { env } from "./config/env";
import { app } from "./app";
import { SocketService } from "./shared/services/socket.service";
import "./modules/wallet/wallet.events";

const bootstrap = async (): Promise<void> => {
  await database.connect();

  const httpServer = createServer(app);

  // Initialize WebSockets
  SocketService.initialize(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`Server is running on http://localhost:${env.port}`);
  });
};

void bootstrap();
