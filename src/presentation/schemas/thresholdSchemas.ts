import { z } from "zod";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";
import { PeriodType } from "@domain/value/PeriodType";

const thresholdBaseSchema = z.object({
  utilityType: z.enum(UtilityType),
  thresholdType: z.enum(ThresholdType),
  value: z.number().positive(),
  thresholdState: z.enum(ThresholdState),
  periodType: z.enum(PeriodType),
});

export const PeriodAggregationSchema = thresholdBaseSchema
  .pick({ periodType: true, value: true })
  .extend({ value: z.number().positive() });

export const createThresholdSchema = thresholdBaseSchema
  .omit({ thresholdState: true, periodType: true })
  .extend({
    thresholdState: z.enum(ThresholdState).optional(),
    periodType: z.enum(PeriodType).optional(),
  });

export const updateThresholdSchema = thresholdBaseSchema
  .partial()
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    message: "At least one field must be provided for update",
  });

export const listThresholdSchema = thresholdBaseSchema
  .omit({ value: true })
  .partial();

export const evaluateThresholdSchema = thresholdBaseSchema
  .pick({ utilityType: true })
  .extend({ aggregations: z.array(PeriodAggregationSchema).nonempty() });
