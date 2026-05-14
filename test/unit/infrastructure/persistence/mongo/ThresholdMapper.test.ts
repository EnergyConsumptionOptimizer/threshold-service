import { Threshold } from "@domain/entity/Threshold";
import {
	toDomain,
	toPersistence,
} from "@infrastructure/persistence/mongo/ThresholdMapper";
import type { ThresholdDoc } from "@infrastructure/persistence/mongo/ThresholdSchema";
import {
	aThreshold,
	PERIOD,
	STATE,
	TYPE,
	UTILITY,
} from "@test/domainFactories";
import { describe, expect, it } from "vitest";

describe("ThresholdMapper", () => {
	describe("toDomain()", () => {
		it("should map a ThresholdDoc to a domain Threshold", () => {
			const doc: ThresholdDoc = {
				_id: "threshold-1",
				name: "Test Threshold",
				utilityType: UTILITY,
				value: 100,
				thresholdType: TYPE,
				thresholdState: STATE,
				periodType: PERIOD.value,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = toDomain(doc);

			expect(result).toBeInstanceOf(Threshold);
			expect(result.id.value).toBe("threshold-1");
			expect(result.name.value).toBe("Test Threshold");
			expect(result.utilityType).toBe(UTILITY);
			expect(result.value.value).toBe(100);
			expect(result.thresholdType).toBe(TYPE);
			expect(result.thresholdState).toBe(STATE);
			expect(result.periodType?.value).toBe(PERIOD.value);
			expect(result.pullDomainEvents()).toHaveLength(0);
		});

		it("should map a ThresholdDoc without periodType to a domain Threshold", () => {
			const doc: ThresholdDoc = {
				_id: "threshold-2",
				name: "Actual Threshold",
				utilityType: UTILITY,
				value: 50,
				thresholdType: "ACTUAL",
				thresholdState: "ENABLED",
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const result = toDomain(doc);

			expect(result).toBeInstanceOf(Threshold);
			expect(result.periodType).toBeUndefined();
		});
	});

	describe("toPersistence()", () => {
		it("should map a domain Threshold to a persistence object", () => {
			const threshold = aThreshold();

			const result = toPersistence(threshold);

			expect(result).toEqual({
				_id: "threshold-1",
				name: "Test Threshold",
				utilityType: UTILITY,
				value: 100,
				thresholdType: TYPE,
				thresholdState: STATE,
				periodType: PERIOD.value,
			});
		});
	});
});
