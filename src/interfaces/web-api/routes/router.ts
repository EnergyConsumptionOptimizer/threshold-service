import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { Router } from "express";
import { ThresholdRouter } from "@interfaces/web-api/routes/thresholdRoutes";
import { internalRoutes } from "@interfaces/web-api/internal/internalRoutes";

export function router(
  thresholdController: ThresholdController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.use(
    "/api/thresholds",
    ThresholdRouter(thresholdController, authMiddleware),
  );

  router.use("/api/internal", internalRoutes(thresholdController));

  return router;
}
