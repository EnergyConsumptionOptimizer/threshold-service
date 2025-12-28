import { Router } from "express";

import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";

export function internalRoutes(
  thresholdController: ThresholdController,
): Router {
  const router = Router();

  router.post(
    "/thresholds/evaluations/forecast",
    thresholdController.evaluateForecast,
  );

  return router;
}
