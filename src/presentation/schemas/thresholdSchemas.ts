import { z } from "zod";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdValue } from "@domain/value/ThresholdValue";

export const createThresholdSchema = z.object({
  utilityType: z.enum(UtilityType),
  periodType: z.enum(PeriodType).optional(),
  thresholdType: z.enum(ThresholdType),
  isActive: z.boolean(),
  value: z
    .number()
    .refine((val) => val > 0, {
      message: "Threshold must be greater than zero",
    })
    .transform((val) => ThresholdValue.of(val)),
});

export const updateThresholdSchema = z
  .object({
    utilityType: z.enum(UtilityType).optional(),
    thresholdType: z.enum(ThresholdType).optional(),
    periodType: z.enum(PeriodType).optional(),
    isActive: z.boolean().optional(),
    value: z
      .number()
      .positive({ message: "Threshold must be greater than zero" })
      .transform((val) => ThresholdValue.of(val))
      .optional(),
  })
  .refine(
    (data) =>
      data.utilityType !== undefined ||
      data.thresholdType !== undefined ||
      data.periodType !== undefined ||
      data.isActive !== undefined ||
      data.value !== undefined,
    { message: "At least one field must be provided" },
  );

export const listThresholdSchema = z.object({
  utilityType: z.enum(UtilityType).optional(),
  periodType: z.enum(PeriodType).optional(),
  thresholdType: z.enum(ThresholdType).optional(),
  isActive: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "true") return true;
    if (val === "false") return false;
    return val;
  }, z.boolean().optional()),
});
