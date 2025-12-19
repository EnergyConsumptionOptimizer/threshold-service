import express, { Express } from "express";
import { apiRouter } from "@interfaces/web-api/dependencies";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import cookieParser from "cookie-parser";

export const createTestApp = (): Express => {
  const app = express();
  app.use(cookieParser());
  app.use(express.json());
  app.use(apiRouter);
  app.use(errorsHandler);
  return app;
};
