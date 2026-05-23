import type { InternalController } from "@presentation/rest/InternalController";
import { forwardAuth } from "@presentation/rest/middleware/auth";
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

	// ── Forwarded‑auth (x‑user‑* headers from API gateway) ─
	router.use("/api/thresholds", forwardAuth, thresholdRoutes(controller));
	router.use(
		"/api/internal/thresholds",
		forwardAuth,
		internalRoutes(internalController),
	);

	return router;
}
