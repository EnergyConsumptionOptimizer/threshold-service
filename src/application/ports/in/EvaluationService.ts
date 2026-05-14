import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";

export interface UtilityReadings {
	electricity?: { value: number };
	water?: { value: number };
	gas?: { value: number };
}

export interface EvaluationContext {
	thresholdType: ThresholdType;
	periodType?: PeriodType;
}

export interface ForecastAggregation {
	periodType: PeriodType;
	value: number;
}

export interface CheckRealtimeParams {
	readonly readings: UtilityReadings;
	readonly context: EvaluationContext;
}

export interface CheckForecastParams {
	readonly utilityType: UtilityType;
	readonly aggregations: ForecastAggregation[];
}

export interface EvaluationService {
	checkRealtimeReadings(params: CheckRealtimeParams): Promise<void>;
	checkForecastReadings(params: CheckForecastParams): Promise<void>;
}
