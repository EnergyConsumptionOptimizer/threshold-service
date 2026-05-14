import { ThresholdNotFoundError } from "@application/errors";
import type {
	CreateThresholdParams,
	CreateThresholdResponse,
	DeleteThresholdResponse,
	GetThresholdByIdResponse,
	ListThresholdsResponse,
	ResetThresholdsResponse,
	ThresholdOutput,
	ThresholdService,
	UpdateThresholdParams,
	UpdateThresholdResponse,
} from "@application/ports/in/ThresholdService";
import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import type { IdGenerator } from "@application/ports/out/IdGenerator";
import { Threshold } from "@domain/entity/Threshold";
import type {
	ActualThresholdWithPeriodError,
	InvalidThresholdValueError,
	MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import type {
	ThresholdFilters,
	ThresholdRepository,
} from "@domain/ports/ThresholdRepository";
import type { UniqueThresholdNameChecker } from "@domain/services/UniqueThresholdNameChecker";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdName } from "@domain/value/ThresholdName";
import {
	type ThresholdState,
	ThresholdStates,
} from "@domain/value/ThresholdState";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import type { Logger } from "pino";

export class ThresholdServiceImpl implements ThresholdService {
	readonly #repository: ThresholdRepository;
	readonly #idGenerator: IdGenerator;
	readonly #metrics: BusinessMetricsPort;
	readonly #nameUniqueness: UniqueThresholdNameChecker;
	readonly #logger?: Logger;

	constructor(
		repository: ThresholdRepository,
		idGenerator: IdGenerator,
		metrics: BusinessMetricsPort,
		nameUniqueness: UniqueThresholdNameChecker,
		logger?: Logger,
	) {
		this.#repository = repository;
		this.#idGenerator = idGenerator;
		this.#metrics = metrics;
		this.#nameUniqueness = nameUniqueness;
		this.#logger = logger;
	}

	async create(
		params: CreateThresholdParams,
	): Promise<CreateThresholdResponse> {
		const name = ThresholdName.of(params.name);
		if (name instanceof Error) return name;

		const uniquenessResult = await this.#nameUniqueness.ensureAvailable(name);
		if (uniquenessResult instanceof Error) return uniquenessResult;

		const value = ThresholdValue.of(params.value);
		if (value instanceof Error) return value;

		const id = ThresholdId.of(this.#idGenerator.generate());
		if (id instanceof Error) return id;

		const threshold = Threshold.create(
			id,
			name,
			params.utilityType,
			value,
			params.thresholdType,
			params.periodType,
		);
		if (threshold instanceof Error) return threshold;

		await this.#repository.save(threshold);

		this.#metrics.recordThresholdCreation();
		this.#logger?.info(
			{ thresholdId: threshold.id.value, name: threshold.name.value },
			"Threshold created",
		);
		return toOutput(threshold);
	}

	async getById(id: string): Promise<GetThresholdByIdResponse> {
		const thresholdId = ThresholdId.of(id);
		if (thresholdId instanceof Error) return thresholdId;

		const threshold = await this.#repository.findById(thresholdId);
		if (!threshold) return new ThresholdNotFoundError(id);

		return toOutput(threshold);
	}

	async list(filters: ThresholdFilters): Promise<ListThresholdsResponse> {
		const thresholds = await this.#repository.findByFilters(filters);
		return thresholds.map(toOutput);
	}

	async update(
		id: string,
		updates: UpdateThresholdParams,
	): Promise<UpdateThresholdResponse> {
		const thresholdId = ThresholdId.of(id);
		if (thresholdId instanceof Error) return thresholdId;

		const existing = await this.#repository.findById(thresholdId);
		if (!existing) return new ThresholdNotFoundError(id);

		if (updates.name !== undefined) {
			const name = ThresholdName.of(updates.name);
			if (name instanceof Error) return name;

			if (!name.equals(existing.name)) {
				const uniquenessResult = await this.#nameUniqueness.ensureAvailable(
					name,
					existing.id.value,
				);
				if (uniquenessResult instanceof Error) return uniquenessResult;
			}

			existing.changeName(name);
		}

		const result = this.#applyUpdates(existing, updates);
		if (result instanceof Error) return result;

		await this.#repository.save(existing);

		this.#metrics.recordThresholdUpdate();
		return toOutput(existing);
	}

	async delete(id: string): Promise<DeleteThresholdResponse> {
		const thresholdId = ThresholdId.of(id);
		if (thresholdId instanceof Error) return thresholdId;

		const existing = await this.#repository.findById(thresholdId);
		if (!existing) return new ThresholdNotFoundError(id);

		await this.#repository.remove(existing);

		this.#metrics.recordThresholdDeletion();
		this.#logger?.info({ thresholdId: id }, "Threshold deleted");
		return undefined;
	}

	async reset(): Promise<ResetThresholdsResponse> {
		const now = new Date();
		const all = await this.#repository.findAll();
		const resetThresholds: Threshold[] = [];

		for (const threshold of all) {
			if (threshold.canReset(now)) {
				threshold.reset();
				resetThresholds.push(threshold);
			}
		}

		for (const t of resetThresholds) {
			await this.#repository.save(t);
		}

		resetThresholds.forEach(() => {
			this.#metrics.recordThresholdUpdate();
		});

		return resetThresholds.map(toOutput);
	}

	#applyUpdates(
		threshold: Threshold,
		updates: UpdateThresholdParams,
	):
		| undefined
		| InvalidThresholdValueError
		| ActualThresholdWithPeriodError
		| MissingPeriodTypeForThresholdError {
		if (updates.value !== undefined) {
			const value = ThresholdValue.of(updates.value);
			if (value instanceof Error) return value;
			threshold.changeValue(value);
		}

		if (updates.utilityType !== undefined) {
			threshold.changeUtilityType(updates.utilityType);
		}

		if (updates.thresholdType !== undefined) {
			const result = threshold.changeType(
				updates.thresholdType,
				updates.periodType,
			);
			if (result instanceof Error) return result;
		} else if (updates.periodType !== undefined) {
			const result = threshold.changeType(
				threshold.thresholdType,
				updates.periodType,
			);
			if (result instanceof Error) return result;
		}

		if (updates.thresholdState !== undefined) {
			this.#applyStateChange(threshold, updates.thresholdState);
		}
	}

	#applyStateChange(threshold: Threshold, state: ThresholdState): void {
		if (state === ThresholdStates.ENABLED) {
			threshold.enable();
		} else if (state === ThresholdStates.DISABLED) {
			threshold.disable();
		}
	}
}

function toOutput(threshold: Threshold): ThresholdOutput {
	return {
		id: threshold.id.value,
		name: threshold.name.value,
		utilityType: threshold.utilityType,
		value: threshold.value.value,
		thresholdType: threshold.thresholdType,
		thresholdState: threshold.thresholdState,
		...(threshold.periodType && { periodType: threshold.periodType.value }),
	};
}
