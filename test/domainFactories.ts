import { Threshold } from "@domain/entity/Threshold";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdId } from "@domain/value/ThresholdId";
import { ThresholdName } from "@domain/value/ThresholdName";
import {
	type ThresholdState,
	ThresholdStates,
} from "@domain/value/ThresholdState";
import {
	type ThresholdType,
	ThresholdTypes,
} from "@domain/value/ThresholdType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { type UtilityType, UtilityTypes } from "@domain/value/UtilityType";

export function validId(value = "threshold-1"): ThresholdId {
	return ThresholdId.of(value) as ThresholdId;
}

export function validName(value = "Test Threshold"): ThresholdName {
	return ThresholdName.of(value) as ThresholdName;
}

export function validValue(value = 100): ThresholdValue {
	return ThresholdValue.of(value) as ThresholdValue;
}

export const UTILITY = UtilityTypes.ELECTRICITY;
export const TYPE = ThresholdTypes.HISTORICAL;
export const STATE = ThresholdStates.ENABLED;
export const PERIOD = PeriodType.ONE_DAY;

function hasOwn<K extends string>(
	obj: Record<string, unknown> | undefined,
	key: K,
): obj is Record<K, unknown> {
	return obj !== undefined && key in obj;
}

export function aThreshold(overrides?: {
	id?: ThresholdId;
	name?: ThresholdName;
	utilityType?: UtilityType;
	value?: ThresholdValue;
	thresholdType?: ThresholdType;
	thresholdState?: ThresholdState;
	periodType?: PeriodType;
}): Threshold {
	return Threshold.restore(
		overrides?.id ?? validId(),
		overrides?.name ?? validName(),
		overrides?.utilityType ?? UTILITY,
		overrides?.value ?? validValue(),
		overrides?.thresholdType ?? TYPE,
		overrides?.thresholdState ?? STATE,
		hasOwn(overrides, "periodType") ? overrides.periodType : PERIOD,
	);
}

export function aNewThreshold(overrides?: {
	id?: ThresholdId;
	name?: ThresholdName;
	utilityType?: UtilityType;
	value?: ThresholdValue;
	thresholdType?: ThresholdType;
	periodType?: PeriodType;
}): Threshold {
	return Threshold.create(
		overrides?.id ?? validId(),
		overrides?.name ?? validName(),
		overrides?.utilityType ?? UTILITY,
		overrides?.value ?? validValue(),
		overrides?.thresholdType ?? TYPE,
		hasOwn(overrides, "periodType") ? overrides.periodType : PERIOD,
	) as Threshold;
}
