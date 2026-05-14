import { DuplicateThresholdNameError } from "@domain/errors";
import type { ThresholdRepository } from "@domain/ports/ThresholdRepository";
import type { UniqueThresholdNameChecker } from "@domain/services/UniqueThresholdNameChecker";
import type { ThresholdName } from "@domain/value/ThresholdName";

export class ThresholdNameUniquenessPolicy
	implements UniqueThresholdNameChecker
{
	readonly #repository: ThresholdRepository;

	constructor(repository: ThresholdRepository) {
		this.#repository = repository;
	}

	async ensureAvailable(
		name: ThresholdName,
		excludeId?: string,
	): Promise<undefined | DuplicateThresholdNameError> {
		const matches = await this.#repository.findByFilters({ name });
		const duplicate = excludeId
			? matches.find((t) => t.id.value !== excludeId)
			: matches[0];
		return duplicate ? new DuplicateThresholdNameError(name.value) : undefined;
	}
}
