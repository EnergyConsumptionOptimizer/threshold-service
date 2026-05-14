export const ThresholdStates = {
	ENABLED: "ENABLED",
	DISABLED: "DISABLED",
	BREACHED: "BREACHED",
} as const;

export type ThresholdState =
	(typeof ThresholdStates)[keyof typeof ThresholdStates];
