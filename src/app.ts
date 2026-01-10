import express from "express";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import cookieParser from "cookie-parser";
import type { Router } from "express";

/**
 * Create the Express application instance.
 *
 * @param apiRouter API router containing all routes.
 * @returns A configured Express application.
 */
export function createApp(apiRouter: Router) {
  const app = express();

  app.use(cookieParser());
  app.use(express.json());
  app.use(apiRouter);
  app.use(errorsHandler);

  return app;
}
