import { DomainErrorCode, InvalidThresholdValueError } from "@domain/errors";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { describe, expect, it } from "vitest";

describe("ThresholdValue Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a positive integer", input: 100 },
			{ scenario: "a positive float", input: 3.14 },
		])("should successfully create when provided $scenario", ({ input }) => {
			const result = ThresholdValue.of(input);
			expect(result).toBeInstanceOf(ThresholdValue);
			expect((result as ThresholdValue).value).toBe(input);
		});

		it.each([
			{ scenario: "zero", input: 0 },
			{ scenario: "a negative number", input: -5 },
		])("should return InvalidThresholdValueError when provided $scenario", ({
			input,
		}) => {
			const result = ThresholdValue.of(input);
			expect(result).toBeInstanceOf(InvalidThresholdValueError);
			if (result instanceof InvalidThresholdValueError) {
				expect(result.code).toBe(DomainErrorCode.THRESHOLD_VALUE_NOT_POSITIVE);
			}
		});
	});

	describe("isBreachedBy()", () => {
		it("should return true when measured exceeds the limit", () => {
			const limit = ThresholdValue.of(100) as ThresholdValue;
			expect(limit.isBreachedBy(150)).toBe(true);
		});

		it("should return false when measured is below the limit", () => {
			const limit = ThresholdValue.of(100) as ThresholdValue;
			expect(limit.isBreachedBy(50)).toBe(false);
		});

		it("should return false when measured equals the limit", () => {
			const limit = ThresholdValue.of(100) as ThresholdValue;
			expect(limit.isBreachedBy(100)).toBe(false);
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same numeric value",
				val1: 100,
				val2: 100,
				expected: true,
			},
			{
				scenario: "different numeric values",
				val1: 100,
				val2: 200,
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(ThresholdValue.of(val1) as ThresholdValue).equals(
					ThresholdValue.of(val2) as ThresholdValue,
				),
			).toBe(expected);
		});
	});
});
