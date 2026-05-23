import type { ThresholdService } from "@application/ports/in/ThresholdService";
import { PeriodType } from "@domain/value/PeriodType";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export class ThresholdController {
	readonly #thresholdService: ThresholdService;

	constructor(thresholdService: ThresholdService) {
		this.#thresholdService = thresholdService;
	}

	async create(req: Request, res: Response) {
		const { name, utilityType, value, thresholdType, periodType } = req.body;
		const periodTypeVO = periodType ? PeriodType.of(periodType) : undefined;
		if (periodTypeVO instanceof Error) throw periodTypeVO;

		const result = await this.#thresholdService.create({
			name,
			utilityType,
			value,
			thresholdType,
			periodType: periodTypeVO,
		});
		if (result instanceof Error) throw result;
		res.status(StatusCodes.CREATED).json(result);
	}

	async list(req: Request, res: Response) {
		const thresholds = await this.#thresholdService.list(req.query);
		res.status(StatusCodes.OK).json(thresholds);
	}

	async findById(req: Request, res: Response) {
		const result = await this.#thresholdService.getById(req.params.id);
		if (result instanceof Error) throw result;
		res.status(StatusCodes.OK).json(result);
	}

	async update(req: Request, res: Response) {
		const updates = { ...req.body };
		if (updates.periodType) {
			const periodTypeVO = PeriodType.of(updates.periodType);
			if (periodTypeVO instanceof Error) throw periodTypeVO;
			updates.periodType = periodTypeVO;
		} else if (updates.periodType === "") {
			updates.periodType = undefined;
		}
		const result = await this.#thresholdService.update(req.params.id, updates);
		if (result instanceof Error) throw result;
		res.status(StatusCodes.OK).json(result);
	}

	async delete(req: Request, res: Response) {
		const result = await this.#thresholdService.delete(req.params.id);
		if (result instanceof Error) throw result;
		res.sendStatus(StatusCodes.NO_CONTENT);
	}
}
