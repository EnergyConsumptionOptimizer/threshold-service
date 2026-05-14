import { DomainErrorCode, InvalidThresholdNameError } from "@domain/errors";
import { ThresholdName } from "@domain/value/ThresholdName";
import { describe, expect, it } from "vitest";

describe("ThresholdName Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{
				scenario: "a valid string",
				input: "Electricity Limit",
				expected: "Electricity Limit",
			},
			{
				scenario: "surrounding whitespace",
				input: "   Gas Cap   ",
				expected: "Gas Cap",
			},
		])("should successfully create when provided $scenario", ({
			input,
			expected,
		}) => {
			const result = ThresholdName.of(input);
			expect(result).toBeInstanceOf(ThresholdName);
			expect((result as ThresholdName).value).toBe(expected);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
			{ scenario: "only whitespace", input: "    " },
		])("should return InvalidThresholdNameError when provided $scenario", ({
			input,
		}) => {
			const result = ThresholdName.of(input);
			expect(result).toBeInstanceOf(InvalidThresholdNameError);
			if (result instanceof InvalidThresholdNameError) {
				expect(result.code).toBe(DomainErrorCode.THRESHOLD_NAME_EMPTY);
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying value",
				val1: "Alpha",
				val2: "Alpha",
				expected: true,
			},
			{
				scenario: "different underlying values",
				val1: "Alpha",
				val2: "Beta",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(ThresholdName.of(val1) as ThresholdName).equals(
					ThresholdName.of(val2) as ThresholdName,
				),
			).toBe(expected);
		});
	});
});
