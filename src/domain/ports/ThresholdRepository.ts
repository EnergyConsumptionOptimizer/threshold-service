import type { Threshold } from "@domain/entity/Threshold";
import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdId } from "@domain/value/ThresholdId";
import type { ThresholdName } from "@domain/value/ThresholdName";
import type { ThresholdState } from "@domain/value/ThresholdState";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";

export interface ThresholdFilters {
	name?: ThresholdName;
	utilityType?: UtilityType;
	thresholdType?: ThresholdType;
	state?: ThresholdState;
	periodType?: PeriodType;
}

export interface ThresholdRepository {
	findById(id: ThresholdId): Promise<Threshold | undefined>;
	findAll(): Promise<Threshold[]>;
	findBreached(): Promise<Threshold[]>;
	findByFilters(filters: ThresholdFilters): Promise<Threshold[]>;
	findActive(
		utilityType: UtilityType,
		thresholdType: ThresholdType,
		periodType?: PeriodType,
	): Promise<Threshold[]>;
	save(threshold: Threshold): Promise<void>;
	remove(threshold: Threshold): Promise<void>;
}
