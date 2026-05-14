import type { DuplicateThresholdNameError } from "@domain/errors";
import type { ThresholdName } from "@domain/value/ThresholdName";

export interface UniqueThresholdNameChecker {
	ensureAvailable(
		name: ThresholdName,
		excludeId?: string,
	): Promise<undefined | DuplicateThresholdNameError>;
}
