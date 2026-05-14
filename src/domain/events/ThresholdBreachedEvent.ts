import type { DomainEvent } from "@domain/events/DomainEvent";
import type { PeriodType } from "@domain/value/PeriodType";
import type { ThresholdId } from "@domain/value/ThresholdId";
import type { ThresholdName } from "@domain/value/ThresholdName";
import type { ThresholdType } from "@domain/value/ThresholdType";
import type { UtilityType } from "@domain/value/UtilityType";

export interface ThresholdBreachedPayload extends Record<string, unknown> {
	readonly thresholdId: string;
	readonly thresholdName: string;
	readonly utilityType: string;
	readonly thresholdType: string;
	readonly limitValue: number;
	readonly detectedValue: number;
	readonly periodType?: string;
}

export class ThresholdBreachedEvent
	implements DomainEvent<ThresholdBreachedPayload>
{
	readonly eventType = "ThresholdBreachedEvent";
	readonly aggregateType = "Threshold";
	readonly aggregateId: string;
	readonly occurredAt: string;
	readonly payload: ThresholdBreachedPayload;

	constructor(
		thresholdId: ThresholdId,
		thresholdName: ThresholdName,
		utilityType: UtilityType,
		thresholdType: ThresholdType,
		limitValue: number,
		detectedValue: number,
		periodType?: PeriodType,
	) {
		this.aggregateId = thresholdId.value;
		this.occurredAt = new Date().toISOString();
		this.payload = {
			thresholdId: thresholdId.value,
			thresholdName: thresholdName.value,
			utilityType,
			thresholdType,
			limitValue,
			detectedValue,
			periodType: periodType?.value,
		};
	}
}
