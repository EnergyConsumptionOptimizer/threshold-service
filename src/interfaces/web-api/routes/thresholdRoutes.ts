import { Router } from "express";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";

export function ThresholdRouter(
  thresholdController: ThresholdController,
  authMiddleware: AuthMiddleware,
) {
  const router = Router();

  router
    .route("/")
    .post(authMiddleware.authenticateAdmin, thresholdController.create)
    .get(authMiddleware.authenticate, thresholdController.list);

  router
    .route("/:id")
    .get(authMiddleware.authenticate, thresholdController.findById)
    .put(authMiddleware.authenticateAdmin, thresholdController.update)
    .delete(authMiddleware.authenticateAdmin, thresholdController.delete);

  router.post(
    "/evaluations/forecast",
    authMiddleware.authenticateAdmin,
    thresholdController.evaluateForecast,
  );

  return router;
}
