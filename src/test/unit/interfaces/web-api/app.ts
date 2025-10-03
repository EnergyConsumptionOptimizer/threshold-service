import "dotenv/config";
import express from "express";
import { apiRouter } from "./dependencies";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";

const app = express();

app.use(express.json());
app.use(apiRouter);
app.use(errorsHandler);

export { app };
