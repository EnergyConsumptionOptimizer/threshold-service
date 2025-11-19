import { z } from "zod";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { UtilityType } from "@domain/value/UtilityType";

export const consumptionDataSchema = z.object({
  utilityType: z.enum(UtilityType),
  thresholdType: z.enum(ThresholdType),
  periodType: z.enum(PeriodType).optional(),
  value: z.number().nonnegative(),
});

export type ConsumptionDataDTO = z.infer<typeof consumptionDataSchema>;

export function parseConsumptionData(data: unknown) {
  return consumptionDataSchema.safeParse(data);
}

export function mapConsumptionDataToDomain(dto: ConsumptionDataDTO) {
  return dto;
}
