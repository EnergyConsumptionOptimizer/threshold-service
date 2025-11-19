import { Router } from "express";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";

export function ThresholdRouter(
  thresholdController: ThresholdController,
  authMiddleware: AuthMiddleware,
) {
  const router = Router();

  router.post(
    "/",
    authMiddleware.authenticateAdmin,
    thresholdController.create,
  );
  router.get("/", authMiddleware.authenticate, thresholdController.list);
  router.get("/:id", authMiddleware.authenticate, thresholdController.findById);
  router.put(
    "/:id",
    authMiddleware.authenticateAdmin,
    thresholdController.update,
  );
  router.delete(
    "/:id",
    authMiddleware.authenticateAdmin,
    thresholdController.delete,
  );
  router.post(
    "/evaluations/forecast",
    authMiddleware.authenticateAdmin,
    thresholdController.evaluateForecast,
  );

  return router;
}
