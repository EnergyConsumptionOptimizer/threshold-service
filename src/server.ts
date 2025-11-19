import "dotenv/config";
import mongoose from "mongoose";
import app from "./app";
import {
  thresholdResetScheduler,
  thresholdMonitoringService,
  createConsumptionEventListener,
} from "@interfaces/web-api/dependencies";

const PORT = parseInt(process.env.PORT || "3000", 10);
const MONGO_URI =
  process.env.MONGO_URI ||
  `mongodb://${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGO_DB}`;

async function connectDatabase() {
  if (process.env.SKIP_DB_CONNECTION === "true") {
    return;
  }
  await mongoose.connect(MONGO_URI);
  console.log("Database connected");
}

async function startMonitoring() {
  try {
    await thresholdMonitoringService.start();
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
    const listener = createConsumptionEventListener();
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

    const server = app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });

    thresholdResetScheduler.start();
    console.log("Reset scheduler started");

    await startMonitoring();
    const consumptionListener = await startConsumptionListener();

    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down...`);

      await consumptionListener?.disconnect();
      await thresholdMonitoringService.stop();
      thresholdResetScheduler.stop();

      server.close(() => console.log("Server closed"));
      await mongoose.disconnect();

      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start:", error);
    process.exit(1);
  }
}

start();
