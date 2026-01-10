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
  await mongoose.connect(config.db.uri);
  console.log("Database connected");
}

async function startMonitoring() {
  try {
    await webApi.thresholdMonitoringService.start();
    console.log("Threshold monitoring started");
  } catch (err) {
    console.warn(
      "Threshold monitoring unavailable:",
      err instanceof Error ? err.message : String(err),
    );
  }
}

async function startConsumptionListener() {
  try {
    const listener = webApi.createConsumptionEventListener();
    await listener.connect();
    console.log("Consumption listener started");
    return listener;
  } catch (err) {
    console.warn(
      "Consumption listener unavailable:",
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

async function start() {
  try {
    await connectDatabase();

    app.listen(config.server.port, () => {
      console.log(`Server listening on port ${config.server.port}`);
    });

    webApi.thresholdResetScheduler.start();
    console.log("Reset scheduler started");

    await startMonitoring();
    await startConsumptionListener();
  } catch (error) {
    console.error("Failed to start:", error);
    process.exit(1);
  }
}

start();
