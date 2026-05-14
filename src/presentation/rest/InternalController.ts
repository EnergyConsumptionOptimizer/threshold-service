import type {
	CheckForecastParams,
	CheckRealtimeParams,
	EvaluationService,
} from "@application/ports/in/EvaluationService";
import type { ThresholdService } from "@application/ports/in/ThresholdService";
import { PeriodType } from "@domain/value/PeriodType";
import type { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";

export class InternalController {
	readonly #evaluationService: EvaluationService;
	readonly #thresholdService: ThresholdService;

	constructor(
		evaluationService: EvaluationService,
		thresholdService: ThresholdService,
	) {
		this.#evaluationService = evaluationService;
		this.#thresholdService = thresholdService;
	}

	async evaluateRealtime(req: Request, res: Response): Promise<void> {
		const { readings, context } = req.body;

		const periodTypeResult = context.periodType
			? PeriodType.of(context.periodType)
			: undefined;
		if (periodTypeResult instanceof Error) throw periodTypeResult;

		const params: CheckRealtimeParams = {
			readings,
			context: {
				thresholdType: context.thresholdType,
				periodType: periodTypeResult,
			},
		};

		await this.#evaluationService.checkRealtimeReadings(params);
		res.sendStatus(StatusCodes.OK);
	}

	async evaluateForecast(req: Request, res: Response): Promise<void> {
		const { utilityType, aggregations } = req.body;

		const params: CheckForecastParams = {
			utilityType,
			aggregations: aggregations.map(
				(a: { periodType: string; value: number }) => {
					const parsed = PeriodType.of(a.periodType);
					if (parsed instanceof Error) throw parsed;
					return { periodType: parsed, value: a.value };
				},
			),
		};

		await this.#evaluationService.checkForecastReadings(params);
		res.sendStatus(StatusCodes.OK);
	}

	async resetBreached(_req: Request, res: Response): Promise<void> {
		const result = await this.#thresholdService.reset();
		if (result instanceof Error) throw result;
		res.status(StatusCodes.OK).json(result);
	}
}
