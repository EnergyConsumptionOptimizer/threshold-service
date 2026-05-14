import { AggregateRoot } from "@domain/entity/AggregateRoot";
import {
	ActualThresholdWithPeriodError,
	MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import { ThresholdBreachedEvent } from "@domain/events/ThresholdBreachedEvent";
import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdId } from "@domain/value/ThresholdId";
import type { ThresholdName } from "@domain/value/ThresholdName";
import {
	type ThresholdState,
	ThresholdStates,
} from "@domain/value/ThresholdState";
import {
	type ThresholdType,
	ThresholdTypes,
} from "@domain/value/ThresholdType";
import type { ThresholdValue } from "@domain/value/ThresholdValue";
import type { UtilityType } from "@domain/value/UtilityType";

export class Threshold extends AggregateRoot {
	#name: ThresholdName;
	#utilityType: UtilityType;
	#value: ThresholdValue;
	#thresholdType: ThresholdType;
	#thresholdState: ThresholdState;
	#periodType?: PeriodType;

	private constructor(
		public readonly id: ThresholdId,
		name: ThresholdName,
		utilityType: UtilityType,
		value: ThresholdValue,
		thresholdType: ThresholdType,
		thresholdState: ThresholdState,
		periodType?: PeriodType,
	) {
		super();
		this.#name = name;
		this.#utilityType = utilityType;
		this.#value = value;
		this.#thresholdType = thresholdType;
		this.#thresholdState = thresholdState;
		this.#periodType = periodType;
	}

	get name(): ThresholdName {
		return this.#name;
	}
	get utilityType(): UtilityType {
		return this.#utilityType;
	}
	get value(): ThresholdValue {
		return this.#value;
	}
	get thresholdType(): ThresholdType {
		return this.#thresholdType;
	}
	get thresholdState(): ThresholdState {
		return this.#thresholdState;
	}
	get periodType(): PeriodType | undefined {
		return this.#periodType;
	}

	get isBreached(): boolean {
		return this.#thresholdState === ThresholdStates.BREACHED;
	}

	static create(
		id: ThresholdId,
		name: ThresholdName,
		utilityType: UtilityType,
		value: ThresholdValue,
		thresholdType: ThresholdType,
		periodType?: PeriodType,
	):
		| Threshold
		| ActualThresholdWithPeriodError
		| MissingPeriodTypeForThresholdError {
		const error = Threshold.#validateConfiguration(thresholdType, periodType);
		if (error) return error;

		const threshold = new Threshold(
			id,
			name,
			utilityType,
			value,
			thresholdType,
			ThresholdStates.ENABLED,
			periodType,
		);
		return threshold;
	}

	static restore(
		id: ThresholdId,
		name: ThresholdName,
		utilityType: UtilityType,
		value: ThresholdValue,
		thresholdType: ThresholdType,
		thresholdState: ThresholdState,
		periodType?: PeriodType,
	): Threshold {
		return new Threshold(
			id,
			name,
			utilityType,
			value,
			thresholdType,
			thresholdState,
			periodType,
		);
	}

	static #validateConfiguration(
		thresholdType: ThresholdType,
		periodType?: PeriodType,
	):
		| undefined
		| ActualThresholdWithPeriodError
		| MissingPeriodTypeForThresholdError {
		if (thresholdType === ThresholdTypes.ACTUAL) {
			if (periodType) return new ActualThresholdWithPeriodError();
		} else if (!periodType) {
			return new MissingPeriodTypeForThresholdError(thresholdType);
		}
	}

	changeName(newName: ThresholdName): void {
		this.#name = newName;
	}

	changeValue(newValue: ThresholdValue): void {
		this.#value = newValue;
	}

	changeUtilityType(newUtilityType: UtilityType): void {
		this.#utilityType = newUtilityType;
	}

	changeType(
		thresholdType: ThresholdType,
		periodType?: PeriodType,
	):
		| undefined
		| ActualThresholdWithPeriodError
		| MissingPeriodTypeForThresholdError {
		const error = Threshold.#validateConfiguration(thresholdType, periodType);
		if (error) return error;

		this.#thresholdType = thresholdType;
		this.#periodType = periodType;
		return;
	}

	enable(): void {
		this.#thresholdState = ThresholdStates.ENABLED;
	}

	disable(): void {
		this.#thresholdState = ThresholdStates.DISABLED;
	}

	check(input: number): void {
		if (this.#thresholdState !== ThresholdStates.ENABLED) {
			return;
		}
		if (!this.#value.isBreachedBy(input)) {
			return;
		}
		this.#thresholdState = ThresholdStates.BREACHED;
		this.addDomainEvent(
			new ThresholdBreachedEvent(
				this.id,
				this.#name,
				this.#utilityType,
				this.#thresholdType,
				this.#value.value,
				input,
				this.#periodType,
			),
		);
	}

	reset(): void {
		if (this.#thresholdState === ThresholdStates.BREACHED) {
			this.#thresholdState = ThresholdStates.ENABLED;
		}
	}

	canReset(now: Date): boolean {
		return (
			this.#thresholdState === ThresholdStates.BREACHED &&
			this.#periodType?.isEligibleForReset(now) === true
		);
	}

	equals(other: Threshold): boolean {
		return this.id.equals(other.id);
	}
}
