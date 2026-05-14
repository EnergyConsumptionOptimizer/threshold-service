import type { BusinessMetricsPort } from "@application/ports/out/BusinessMetricsPort";
import {
	thresholdBreachesTotal,
	thresholdCreationsTotal,
	thresholdDeletionsTotal,
	thresholdUpdatesTotal,
} from "./businessMetrics";

export class OtelBusinessMetrics implements BusinessMetricsPort {
	recordThresholdCreation(): void {
		thresholdCreationsTotal.add(1);
	}

	recordThresholdUpdate(): void {
		thresholdUpdatesTotal.add(1);
	}

	recordThresholdDeletion(): void {
		thresholdDeletionsTotal.add(1);
	}

	recordThresholdBreach(utilityType: string): void {
		thresholdBreachesTotal.add(1, { utilityType });
	}
}
