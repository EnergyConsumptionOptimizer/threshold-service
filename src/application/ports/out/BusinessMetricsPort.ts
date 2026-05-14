export interface BusinessMetricsPort {
	recordThresholdCreation(): void;
	recordThresholdUpdate(): void;
	recordThresholdDeletion(): void;
	recordThresholdBreach(utilityType: string): void;
}
