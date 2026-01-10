import type { Express } from "express";
import { createWebApiDependencies } from "@interfaces/web-api/dependencies";
import { createApp } from "../../../app";

export const createTestApp = (): Express => {
  const webApi = createWebApiDependencies({
    alertServiceUrl: "http://alert-service:3004",
    monitoringServiceUrl: "http://monitoring-service:3005",
    monitoringIntervalMs: 10000,
    userServiceUrl: "http://user-service:3000",
  });

  return createApp(webApi.apiRouter);
};
