import { z } from "zod";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { UtilityType } from "@domain/value/UtilityType";

/** Validate the shape of consumption messages received from external sources. */
export const consumptionDataSchema = z.object({
  utilityType: z.enum(UtilityType),
  thresholdType: z.enum(ThresholdType),
  periodType: z.enum(PeriodType).optional(),
  value: z.number().nonnegative(),
});

/** Infer the DTO type from {@link consumptionDataSchema}. */
export type ConsumptionDataDTO = z.infer<typeof consumptionDataSchema>;

/**
 * Parse and validate a raw consumption payload.
 * @returns A Zod safe-parse result.
 */
export function parseConsumptionData(data: unknown) {
  return consumptionDataSchema.safeParse(data);
}

/**
 * Convert a validated DTO to the shape used by the application layer.
 * @returns The mapped value.
 */
export function mapConsumptionDataToDomain(dto: ConsumptionDataDTO) {
  return dto;
}
