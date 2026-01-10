import dotenv from "dotenv";

dotenv.config();

const envInt = (key: string, def: number): number => {
  const num = parseInt(process.env[key] || "", 10);
  return Number.isFinite(num) ? num : def;
};

const mongoUri =
  process.env.MONGO_URI ??
  `mongodb://${process.env.MONGODB_HOST ?? "localhost"}:${envInt(
    "MONGODB_PORT",
    27017,
  )}/${process.env.MONGO_DB ?? "thresholds"}`;

const userServiceUri =
  process.env.USER_SERVICE_URI ??
  `http://${process.env.USER_SERVICE_HOST ?? "user-service"}:${envInt(
    "USER_SERVICE_PORT",
    3000,
  )}`;

const alertServiceUri =
  process.env.ALERT_SERVICE_URI ??
  `http://${
    process.env.ALERT_SERVICE_HOST ?? "alert-service"
  }:${envInt("ALERT_SERVICE_PORT", 3004)}`;

const monitoringServiceUri =
  process.env.MONITORING_SERVICE_URI ??
  `http://${
    process.env.MONITORING_SERVICE_HOST ?? "monitoring-service"
  }:${envInt("MONITORING_SERVICE_PORT", 3005)}`;

/**
 * Runtime configuration loaded from environment variables.
 */
export const config = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  server: {
    port: envInt("PORT", 3000),
  },
  db: {
    uri: mongoUri,
  },
  services: {
    user: {
      uri: userServiceUri,
    },
    alert: {
      uri: alertServiceUri,
    },
    monitoring: {
      uri: monitoringServiceUri,
      intervalMs: envInt("MONITORING_INTERVAL_MS", 10000),
    },
  },
} as const;
