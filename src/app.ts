import express from "express";
import { apiRouter } from "@interfaces/web-api/dependencies";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";

const app = express();

app.use(express.json());

app.use("/api", apiRouter);

app.use(errorsHandler);

export default app;
