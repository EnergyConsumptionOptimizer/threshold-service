import type { InternalController } from "@presentation/rest/InternalController";
import { requireRole } from "@presentation/rest/middleware/auth";
import { validate } from "@presentation/rest/middleware/validate";
import {
	EvaluateForecastSchema,
	EvaluateRealtimeSchema,
	ResetThresholdsSchema,
} from "@presentation/rest/schemas/internalSchemas";
import { Router } from "express";

const ADMIN = "ADMIN" as const;

export function internalRoutes(internalController: InternalController): Router {
	const router = Router();

	router.post(
		"/evaluations/realtime",
		validate(EvaluateRealtimeSchema),
		(req, res) => internalController.evaluateRealtime(req, res),
	);

	router.post(
		"/evaluations/forecast",
		validate(EvaluateForecastSchema),
		(req, res) => internalController.evaluateForecast(req, res),
	);

	router.post(
		"/reset",
		requireRole(ADMIN),
		validate(ResetThresholdsSchema),
		(req, res) => internalController.resetBreached(req, res),
	);

	return router;
}
