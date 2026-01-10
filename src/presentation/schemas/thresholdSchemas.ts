import { z } from "zod";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdName } from "@domain/value/ThresholdName";

const optionalPeriodTypeSchema = z.preprocess(
  (val) => (val === "" ? undefined : val),
  z.enum(PeriodType).optional(),
);

const thresholdBaseSchema = z.object({
  name: z.string().trim().min(1),
  utilityType: z.enum(UtilityType),
  thresholdType: z.enum(ThresholdType),
  value: z.number().positive(),
  thresholdState: z.enum(ThresholdState),
  periodType: z.enum(PeriodType),
});

/** Validate one aggregation entry for forecast evaluation requests. */
export const PeriodAggregationSchema = thresholdBaseSchema
  .pick({ periodType: true, value: true })
  .extend({ value: z.number().positive() });

/** Validate payloads for threshold creation requests. */
export const createThresholdSchema = thresholdBaseSchema
  .omit({ thresholdState: true, periodType: true })
  .extend({
    thresholdState: z.enum(ThresholdState).optional(),
    periodType: optionalPeriodTypeSchema,
  });

/** Validate payloads for threshold update requests. */
export const updateThresholdSchema = thresholdBaseSchema
  .omit({ periodType: true })
  .partial()
  .extend({
    name: z
      .string()
      .trim()
      .min(1)
      .transform((val) => ThresholdName.of(val))
      .optional(),
    periodType: optionalPeriodTypeSchema,
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    message: "At least one field must be provided for update",
  });

/** Validate query parameters for threshold listing requests. */
export const listThresholdSchema = thresholdBaseSchema
  .omit({ value: true })
  .partial()
  .extend({
    name: z
      .string()
      .trim()
      .min(1)
      .transform((val) => ThresholdName.of(val))
      .optional(),
  });

/** Validate payloads for forecast evaluation requests. */
export const evaluateThresholdSchema = thresholdBaseSchema
  .pick({ utilityType: true })
  .extend({ aggregations: z.array(PeriodAggregationSchema).nonempty() });
