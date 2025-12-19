import express from "express";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import { apiRouter } from "@interfaces/web-api/dependencies";
import cookieParser from "cookie-parser";

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(apiRouter);
app.use(errorsHandler);

export default app;
