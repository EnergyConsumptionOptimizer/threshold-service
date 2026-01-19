import mongoose from "mongoose";
import { createApp } from "./app";
import { config } from "./config";
import { createWebApiDependencies } from "@interfaces/web-api/dependencies";

const webApi = createWebApiDependencies({
  alertServiceUrl: config.services.alert.uri,
  monitoringServiceUrl: config.services.monitoring.uri,
  monitoringIntervalMs: config.services.monitoring.intervalMs,
  userServiceUrl: config.services.user.uri,
});

const app = createApp(webApi.apiRouter);

async function connectDatabase() {
  console.log(`[System] Connecting to Mongo: ${config.db.uri}`);
  await mongoose.connect(config.db.uri);
  console.log("[System] Database connected successfully");
}

async function startServices() {
  app.listen(config.server.port, () => {
    console.log(`[System] HTTP Server listening on port ${config.server.port}`);
  });

  webApi.thresholdResetScheduler.start();

  webApi.thresholdMonitoringService
    .start()
    .then(() => console.log("[System] Threshold Publisher initialized"))
    .catch((err) =>
      console.error("[System] Failed to initialize Publisher:", err.message),
    );

  const subscriber = webApi.createConsumptionEventListener();
  subscriber
    .connect()
    .then(() => console.log("[System] Consumption Subscriber initialized"))
    .catch((err) =>
      console.error("[System] Failed to initialize Subscriber:", err.message),
    );
}

async function start() {
  try {
    await connectDatabase();
    await startServices();
  } catch (error) {
    console.error("[System] Fatal startup error:", error);
    process.exit(1);
  }
}

start();
