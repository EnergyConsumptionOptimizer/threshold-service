import express from "express";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import { apiRouter } from "@interfaces/web-api/dependencies";

const app = express();

app.use(express.json());
app.use(apiRouter);
app.use(errorsHandler);

export default app;
