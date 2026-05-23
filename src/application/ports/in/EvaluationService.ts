import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";

export interface UtilityReadings {
	readonly electricity?: { value: number };
	readonly water?: { value: number };
	readonly gas?: { value: number };
}

export interface EvaluationContext {
	readonly thresholdType: ThresholdType;
	readonly periodType?: PeriodType;
}

export interface ForecastDataPoint {
	readonly date: Date;
	readonly value: number;
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
