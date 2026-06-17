import { database } from "./config/database";
import { env } from "./config/env";
import { app } from "./app";
import "./modules/wallet/wallet.events";

const bootstrap = async (): Promise<void> => {
  await database.connect();

  app.listen(env.port, () => {
    console.log(`Server is running on http://localhost:${env.port}`);
  });
};

void bootstrap();
