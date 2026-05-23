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

export interface ForecastDataPoint {
	date: Date;
	value: number;
}

export interface CheckRealtimeParams {
	readonly readings: UtilityReadings;
	readonly context: EvaluationContext;
}

export interface CheckForecastParams {
	readonly utilityType: UtilityType;
	readonly dataPoints: ForecastDataPoint[];
}

export interface EvaluationService {
	checkRealtimeReadings(params: CheckRealtimeParams): Promise<void>;
	checkForecastReadings(params: CheckForecastParams): Promise<void>;
}
