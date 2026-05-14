import { DomainErrorCode, InvalidThresholdIdError } from "@domain/errors";
import { ThresholdId } from "@domain/value/ThresholdId";
import { describe, expect, it } from "vitest";

describe("ThresholdId Value Object", () => {
	describe("of() factory", () => {
		it.each([
			{ scenario: "a valid string", input: "abc-123", expected: "abc-123" },
			{
				scenario: "surrounding whitespace",
				input: "   abc-123   ",
				expected: "abc-123",
			},
		])("should successfully create when provided $scenario", ({
			input,
			expected,
		}) => {
			const result = ThresholdId.of(input);
			expect(result).toBeInstanceOf(ThresholdId);
			expect((result as ThresholdId).value).toBe(expected);
		});

		it.each([
			{ scenario: "an empty string", input: "" },
			{ scenario: "only whitespace", input: "    " },
		])("should return InvalidThresholdIdError when provided $scenario", ({
			input,
		}) => {
			const result = ThresholdId.of(input);
			expect(result).toBeInstanceOf(InvalidThresholdIdError);
			if (result instanceof InvalidThresholdIdError) {
				expect(result.code).toBe(DomainErrorCode.THRESHOLD_ID_EMPTY);
			}
		});
	});

	describe("equals()", () => {
		it.each([
			{
				scenario: "the same underlying value",
				val1: "abc",
				val2: "abc",
				expected: true,
			},
			{
				scenario: "different underlying values",
				val1: "abc",
				val2: "xyz",
				expected: false,
			},
		])("should return $expected when instances hold $scenario", ({
			val1,
			val2,
			expected,
		}) => {
			expect(
				(ThresholdId.of(val1) as ThresholdId).equals(
					ThresholdId.of(val2) as ThresholdId,
				),
			).toBe(expected);
		});
	});
});
