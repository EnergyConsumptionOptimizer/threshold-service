import { z } from "zod";

const consumptionValueSchema = z.union([
	z.object({
		value: z.number(),
		utilityConsumptionUnit: z.string(),
	}),
	z
		.number()
		.transform((val) => ({ value: val, utilityConsumptionUnit: "unknown" })),
]);

const utilityMetersSchema = z.object({
	electricity: consumptionValueSchema.optional(),
	water: consumptionValueSchema.optional(),
	gas: consumptionValueSchema.optional(),
});

const utilityMetersQueryResultSchema = z.object({
	label: z.string(),
	utilityMeters: utilityMetersSchema,
});

/** Schema for the `utilityMetersUpdate` WebSocket event payload. */
export const utilityMetersUpdateSchema = z.array(
	utilityMetersQueryResultSchema,
);

export type UtilityMetersQueryResultDTO = z.infer<
	typeof utilityMetersQueryResultSchema
>;
