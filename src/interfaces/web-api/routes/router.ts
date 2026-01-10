import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { Router } from "express";

function thresholdRoutes(
  thresholdController: ThresholdController,
  authMiddleware: AuthMiddleware,
): Router {
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

  return router;
}

function internalRoutes(thresholdController: ThresholdController): Router {
  const router = Router();

  router.post(
    "/thresholds/evaluations/forecast",
    thresholdController.evaluateForecast,
  );

  return router;
}

/**
 * Build the top-level API router.
 *
 * @param thresholdController Controller instance backing route handlers.
 * @param authMiddleware Authentication middleware.
 * @returns An Express router with public and internal routes.
 */
export function router(
  thresholdController: ThresholdController,
  authMiddleware: AuthMiddleware,
): Router {
  const router = Router();

  router.get("/health", (_req, res) => res.send("OK"));

  router.use(
    "/api/thresholds",
    thresholdRoutes(thresholdController, authMiddleware),
  );

  router.use("/api/internal", internalRoutes(thresholdController));

  return router;
}
