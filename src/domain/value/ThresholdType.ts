export const ThresholdTypes = {
	ACTUAL: "ACTUAL",
	HISTORICAL: "HISTORICAL",
	FORECAST: "FORECAST",
} as const;

export type ThresholdType =
	(typeof ThresholdTypes)[keyof typeof ThresholdTypes];
