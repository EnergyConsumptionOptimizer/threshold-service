import type { InternalController } from "@presentation/rest/InternalController";
import { internalRoutes } from "@presentation/rest/routes/internalRoutes";
import { thresholdRoutes } from "@presentation/rest/routes/thresholdRoutes";
import type { ThresholdController } from "@presentation/rest/ThresholdController";
import { Router } from "express";
import { StatusCodes } from "http-status-codes";

export function createMainRouter(
	controller: ThresholdController,
	internalController: InternalController,
): Router {
	const router = Router();

	router.get("/health", (_req, res) => {
		res.status(StatusCodes.OK).json({
			status: "ok",
			uptime: process.uptime(),
			timestamp: new Date().toISOString(),
		});
	});

	router.use("/api/thresholds", thresholdRoutes(controller));
	router.use("/api/internal/thresholds", internalRoutes(internalController));

	return router;
}
