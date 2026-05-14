import {
	type ThresholdState,
	ThresholdStates,
} from "@domain/value/ThresholdState";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";
import { ThresholdModel } from "@infrastructure/persistence/mongo/ThresholdSchema";
import {
	aNewThreshold,
	aThreshold,
	PERIOD,
	STATE,
	TYPE,
	UTILITY,
	validId,
	validName,
	validValue,
} from "@test/domainFactories";

export {
	aNewThreshold,
	aThreshold,
	PERIOD,
	STATE,
	TYPE,
	UTILITY,
	validId,
	validName,
	validValue,
};

export async function seedThreshold(
	id = "threshold-1",
	name = "Test Threshold",
	utilityType: UtilityType = UTILITY,
	thresholdType: ThresholdType = TYPE,
	thresholdState: ThresholdState = ThresholdStates.ENABLED,
): Promise<void> {
	await ThresholdModel.create({
		_id: id,
		name,
		utilityType,
		value: 100,
		thresholdType,
		thresholdState,
		periodType: PERIOD.value,
	});
}
