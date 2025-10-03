import "dotenv/config";
import express from "express";
import { apiRouter } from "@interfaces/web-api/dependencies";
import { errorsHandler } from "@interfaces/web-api/middlewares/ErrorsMiddleware";
import mongoose from "mongoose";

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not defined in environment variables.");
  process.exit(1);
}

app.use(express.json());
app.use(apiRouter);
app.use(errorsHandler);

app.listen(PORT, async () => {
  console.log("Thresholds service");
  console.log(`Server running on port ${PORT}`);

  console.log("Connecting to MongoDB...");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB successfully");

  console.log(`Auth API: http://localhost:${PORT}/api/thresholds`);
});
