import { DuplicateThresholdNameError } from "@domain/errors";
import type { ThresholdRepository } from "@domain/ports/ThresholdRepository";
import { ThresholdNameUniquenessPolicy } from "@domain/services/ThresholdNameUniquenessPolicy";
import { aThreshold, validId, validName } from "@test/domainFactories";
import { beforeEach, describe, expect, it } from "vitest";
import { type MockProxy, mock } from "vitest-mock-extended";

describe("ThresholdNameUniquenessPolicy", () => {
	let repository: MockProxy<ThresholdRepository>;
	let policy: ThresholdNameUniquenessPolicy;

	beforeEach(() => {
		repository = mock<ThresholdRepository>();
		policy = new ThresholdNameUniquenessPolicy(repository);
	});

	describe("ensureAvailable()", () => {
		it("should return undefined when no threshold has the given name", async () => {
			repository.findByFilters.mockResolvedValue([]);

			const result = await policy.ensureAvailable(validName("unique-name"));

			expect(result).toBeUndefined();
		});

		it("should return DuplicateThresholdNameError when a threshold already has the name", async () => {
			const existing = aThreshold({ name: validName("taken") });
			repository.findByFilters.mockResolvedValue([existing]);

			const result = await policy.ensureAvailable(validName("taken"));

			expect(result).toBeInstanceOf(DuplicateThresholdNameError);
			if (result instanceof DuplicateThresholdNameError) {
				expect(result.message).toContain("taken");
			}
		});

		it("should ignore the threshold with the excluded ID when checking uniqueness", async () => {
			const existing = aThreshold({
				id: validId("self-id"),
				name: validName("same-name"),
			});
			repository.findByFilters.mockResolvedValue([existing]);

			const result = await policy.ensureAvailable(
				validName("same-name"),
				"self-id",
			);

			expect(result).toBeUndefined();
		});

		it("should detect conflict when another threshold has the name but ID is different from excluded", async () => {
			const other = aThreshold({
				id: validId("other-id"),
				name: validName("conflict-name"),
			});
			repository.findByFilters.mockResolvedValue([other]);

			const result = await policy.ensureAvailable(
				validName("conflict-name"),
				"self-id",
			);

			expect(result).toBeInstanceOf(DuplicateThresholdNameError);
		});
	});
});
