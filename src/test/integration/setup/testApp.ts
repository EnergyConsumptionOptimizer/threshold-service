import express, { Express } from "express";
import { apiRouter } from "@interfaces/web-api/dependencies";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";

export const createTestApp = (): Express => {
  const app = express();
  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(errorsHandler);
  return app;
};
