import { z } from "zod";

export interface UtilityMetersQueryDTO {
  label: string;
  filter?: {
    from?: "1day" | "1week" | "1month";
  };
}

const consumptionValueSchema = z.union([
  z.object({
    value: z.number(),
    utilityConsumptionUnit: z.string().default("unknown"),
  }),
  z.number().transform((val) => ({
    value: val,
    utilityConsumptionUnit: "unknown",
  })),
]);

export const utilityMetersSchema = z.object({
  electricity: consumptionValueSchema.optional(),
  water: consumptionValueSchema.optional(),
  gas: consumptionValueSchema.optional(),
});

const utilityMetersQueryResultSchema = z.object({
  label: z.string(),
  utilityMeters: utilityMetersSchema,
});

export const utilityMetersUpdateSchema = z.array(
  utilityMetersQueryResultSchema,
);

export type UtilityMetersQueryResultDTO = z.infer<
  typeof utilityMetersQueryResultSchema
>;
