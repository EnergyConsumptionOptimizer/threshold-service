import type {
	CheckForecastParams,
	CheckRealtimeParams,
	EvaluationContext,
	EvaluationService,
	UtilityReadings,
} from "@application/ports/in/EvaluationService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { EventPublisher } from "@application/ports/out/EventPublisher";
import type { UnitOfWork } from "@application/ports/out/UnitOfWork";
import type { ThresholdRepository } from "@domain/ports/ThresholdRepository";
import type { PeriodType } from "@domain/value/PeriodType";
import {
	type ThresholdType,
	ThresholdTypes,
} from "@domain/value/ThresholdType";
import { type UtilityType, UtilityTypes } from "@domain/value/UtilityType";
import type { Logger } from "pino";

interface BreachCheck {
	utilityType: UtilityType;
	thresholdType: ThresholdType;
	periodType?: PeriodType;
	value: number;
}

const UTILITY_KEY_MAP: Record<keyof UtilityReadings, UtilityType> = {
	electricity: UtilityTypes.ELECTRICITY,
	water: UtilityTypes.WATER,
	gas: UtilityTypes.GAS,
};

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
		await this.#checkReadings(params.readings, params.context);
	}

	async checkForecastReadings(params: CheckForecastParams): Promise<void> {
		await Promise.all(
			params.aggregations.map((a) =>
				this.#detectBreach({
					utilityType: params.utilityType,
					thresholdType: ThresholdTypes.FORECAST,
					periodType: a.periodType,
					value: a.value,
				}),
			),
		);
	}

	async #checkReadings(
		readings: UtilityReadings,
		context: EvaluationContext,
	): Promise<void> {
		const checks: Promise<void>[] = [];

		for (const [key, data] of Object.entries(readings) as [
			keyof UtilityReadings,
			{ value: number } | undefined,
		][]) {
			if (key in UTILITY_KEY_MAP && data) {
				checks.push(
					this.#detectBreach({
						utilityType: UTILITY_KEY_MAP[key],
						thresholdType: context.thresholdType,
						periodType: context.periodType,
						value: data.value,
					}),
				);
			}
		}

		await Promise.all(checks);
	}

	async #detectBreach(params: BreachCheck): Promise<void> {
		const activeThresholds = await this.#repository.findActive(
			params.utilityType,
			params.thresholdType,
			params.periodType,
		);

		const savePromises: Promise<void>[] = [];

		for (const threshold of activeThresholds) {
			threshold.check(params.value);

			if (threshold.isBreached) {
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

				savePromises.push(
					this.#uow.executeTransactionally(async () => {
						await this.#repository.save(threshold);
						for (const event of threshold.pullDomainEvents()) {
							await this.#eventPublisher.publish(event);
						}
						this.#metrics.recordThresholdBreach(params.utilityType);
					}),
				);
			}
		}

		await Promise.all(savePromises);
	}
}
