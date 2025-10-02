import { z } from "zod";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";

export const createThresholdSchema = z.object({
  resourceType: z.enum(ResourceType),
  periodType: z.enum(PeriodType),
  thresholdType: z.enum(ThresholdType),
  value: z.number(),
});

export const updateThresholdSchema = z.object({
  value: z.number(),
});

export const listThresholdSchema = z.object({
  resourceType: z.enum(ResourceType).optional(),
  periodType: z.enum(PeriodType).optional(),
  thresholdType: z.enum(ThresholdType).optional(),
});
