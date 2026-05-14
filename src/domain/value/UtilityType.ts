export const UtilityTypes = {
	ELECTRICITY: "ELECTRICITY",
	GAS: "GAS",
	WATER: "WATER",
} as const;

export type UtilityType = (typeof UtilityTypes)[keyof typeof UtilityTypes];
