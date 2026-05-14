import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdStates } from "@domain/value/ThresholdState";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import { z } from "zod";

const name = z.string().trim().min(1);
const utilityType = z.enum(UtilityTypes);
const thresholdType = z.enum(ThresholdTypes);
const thresholdState = z.enum(ThresholdStates);
const periodType = z.enum([
	PeriodType.ONE_DAY.value,
	PeriodType.ONE_WEEK.value,
	PeriodType.ONE_MONTH.value,
]);
const value = z.number().positive();

const optionalPeriodType = z.preprocess(
	(val) => (val === "" ? undefined : val),
	periodType.optional(),
);

export const CreateThresholdSchema = z.object({
	body: z.object({
		name,
		utilityType,
		value,
		thresholdType,
		periodType: optionalPeriodType,
	}),
});

export const ThresholdIdParamSchema = z.object({
	params: z.object({
		id: z.string().min(1),
	}),
});

export const ListThresholdSchema = z.object({
	query: z.object({
		name: z.string().optional(),
		utilityType: utilityType.optional(),
		periodType: periodType.optional(),
		thresholdType: thresholdType.optional(),
		thresholdState: thresholdState.optional(),
	}),
});

export const UpdateThresholdSchema = z.object({
	params: z.object({
		id: z.string().min(1),
	}),
	body: z
		.object({
			name: z.string().trim().min(1).optional(),
			value: z.number().positive().optional(),
			thresholdState: thresholdState.optional(),
			periodType: optionalPeriodType,
			thresholdType: thresholdType.optional(),
			utilityType: utilityType.optional(),
		})
		.refine((data) => Object.values(data).some((v) => v !== undefined), {
			message: "At least one field must be provided for update",
		}),
});

export const DeleteThresholdSchema = z.object({
	params: z.object({
		id: z.string().min(1),
	}),
});
