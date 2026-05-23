import { requireRole } from "@presentation/rest/middleware/auth";
import { validate } from "@presentation/rest/middleware/validate";
import {
	CreateThresholdSchema,
	DeleteThresholdSchema,
	ListThresholdSchema,
	ThresholdIdParamSchema,
	UpdateThresholdSchema,
} from "@presentation/rest/schemas/thresholdSchemas";
import type { ThresholdController } from "@presentation/rest/ThresholdController";
import { Router } from "express";

const ADMIN = "ADMIN" as const;

export function thresholdRoutes(
	thresholdController: ThresholdController,
): Router {
	const router = Router();

	router
		.route("/")
		.post(requireRole(ADMIN), validate(CreateThresholdSchema), (req, res) =>
			thresholdController.create(req, res),
		)
		.get(validate(ListThresholdSchema), (req, res) =>
			thresholdController.list(req, res),
		);

	router
		.route("/:id")
		.get(validate(ThresholdIdParamSchema), (req, res) =>
			thresholdController.findById(req, res),
		)
		.put(requireRole(ADMIN), validate(UpdateThresholdSchema), (req, res) =>
			thresholdController.update(req, res),
		)
		.delete(requireRole(ADMIN), validate(DeleteThresholdSchema), (req, res) =>
			thresholdController.delete(req, res),
		);

	return router;
}
