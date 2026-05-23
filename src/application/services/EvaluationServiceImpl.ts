import type {
	CheckForecastParams,
	CheckRealtimeParams,
	EvaluationService,
} from "@application/ports/in/EvaluationService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import type { ThresholdRepository } from "@domain/ports/ThresholdRepository";
import { PeriodType } from "@domain/value/PeriodType";
import {
	type ThresholdType,
	ThresholdTypes,
} from "@domain/value/ThresholdType";
import { type UtilityType, UtilityTypes } from "@domain/value/UtilityType";
import type { Logger } from "pino";

export class EvaluationServiceImpl implements EvaluationService {
	readonly #repository: ThresholdRepository;
	readonly #uow: UnitOfWork;
	readonly #eventPublisher: EventPublisher;
	readonly #metrics: BusinessMetricsPort;
	readonly #logger?: Logger;

	constructor(
		repository: ThresholdRepository,
		uow: UnitOfWork,
		eventPublisher: EventPublisher,
		metrics: BusinessMetricsPort,
		logger?: Logger,
	) {
		this.#repository = repository;
		this.#uow = uow;
		this.#eventPublisher = eventPublisher;
		this.#metrics = metrics;
		this.#logger = logger;
	}

	async checkRealtimeReadings(params: CheckRealtimeParams): Promise<void> {
		const { readings, context } = params;

		await Promise.all(
			(
				[
					[UtilityTypes.ELECTRICITY, readings.electricity],
					[UtilityTypes.WATER, readings.water],
					[UtilityTypes.GAS, readings.gas],
				] as const
			).flatMap(([utilityType, data]) =>
				data
					? [
							this.#detectBreach({
								utilityType,
								value: data.value,
								thresholdType: context.thresholdType,
								periodType: context.periodType,
							}),
						]
					: [],
			),
		);
	}

	async checkForecastReadings(params: CheckForecastParams): Promise<void> {
		const today = new Date();
		const daysRemainingInWeek = today.getDay() === 0 ? 1 : 8 - today.getDay();
		const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
		const daysRemainingInMonth = monthEnd.getDate() - today.getDate() + 1;

		const aggregations = [
			{
				periodType: PeriodType.ONE_DAY,
				value: params.dataPoints[0].value,
			},
			{
				periodType: PeriodType.ONE_WEEK,
				value: params.dataPoints
					.slice(0, daysRemainingInWeek)
					.reduce((sum, p) => sum + p.value, 0),
			},
			{
				periodType: PeriodType.ONE_MONTH,
				value: params.dataPoints
					.slice(0, daysRemainingInMonth)
					.reduce((sum, p) => sum + p.value, 0),
			},
		];

		await Promise.all(
			aggregations.map((a) =>
				this.#detectBreach({
					utilityType: params.utilityType,
					value: a.value,
					thresholdType: ThresholdTypes.FORECAST,
					periodType: a.periodType,
				}),
			),
		);
	}

	async #detectBreach(params: {
		utilityType: UtilityType;
		value: number;
		thresholdType: ThresholdType;
		periodType?: PeriodType;
	}): Promise<void> {
		const activeThresholds = await this.#repository.findActive(
			params.utilityType,
			params.thresholdType,
			params.periodType,
		);

		for (const threshold of activeThresholds) {
			threshold.check(params.value);
		}

		await Promise.all(
			activeThresholds
				.filter((t) => t.isBreached)
				.map((threshold) => {
					this.#logger?.warn(
						{
							thresholdId: threshold.id.value,
							thresholdName: threshold.name.value,
							utilityType: params.utilityType,
							detectedValue: params.value,
							limitValue: threshold.value.value,
						},
						"Threshold breached",
					);
					return this.#uow.executeTransactionally(async () => {
						await this.#repository.save(threshold);
						for (const event of threshold.pullDomainEvents()) {
							await this.#eventPublisher.publish(event);
						}
						this.#metrics.recordThresholdBreach(params.utilityType);
					});
				}),
		);
	}
}
