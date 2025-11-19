import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { Router } from "express";
import { ThresholdRouter } from "@interfaces/web-api/routes/thresholdRoutes";

export function router(
  thresholdController: ThresholdController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(
    "/thresholds",
    ThresholdRouter(thresholdController, authMiddleware),
  );

  return router;
}
