import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import { z } from "zod";

const periodTypeEnum = z.enum([
	PeriodType.ONE_DAY.value,
	PeriodType.ONE_WEEK.value,
	PeriodType.ONE_MONTH.value,
]);

const readingValue = z.object({ value: z.number() });

export const EvaluateRealtimeSchema = z.object({
	body: z.object({
		readings: z.object({
			electricity: readingValue.optional(),
			water: readingValue.optional(),
			gas: readingValue.optional(),
		}),
		context: z.object({
			thresholdType: z.enum(ThresholdTypes),
			periodType: periodTypeEnum.optional(),
		}),
	}),
});

export const EvaluateForecastSchema = z.object({
	body: z.object({
		utilityType: z.enum(UtilityTypes),
		dataPoints: z
			.array(
				z.object({
					date: z.string(),
					value: z.number(),
				}),
			)
			.min(1),
	}),
});

export const ResetThresholdsSchema = z.object({});
