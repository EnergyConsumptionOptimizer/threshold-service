import { DomainErrorCode, InvalidPeriodTypeError } from "@domain/errors";
import { PeriodType } from "@domain/value/PeriodType";
import { describe, expect, it } from "vitest";

describe("PeriodType Value Object", () => {
	describe("static instances", () => {
		it("should have ONE_DAY, ONE_WEEK, ONE_MONTH", () => {
			expect(PeriodType.ONE_DAY.value).toBe("ONE_DAY");
			expect(PeriodType.ONE_WEEK.value).toBe("ONE_WEEK");
			expect(PeriodType.ONE_MONTH.value).toBe("ONE_MONTH");
		});

		it("should be distinct instances", () => {
			expect(PeriodType.ONE_DAY).not.toBe(PeriodType.ONE_WEEK);
		});
	});

	describe("of() factory", () => {
		it.each([
			{ scenario: "ONE_DAY", input: "ONE_DAY", expected: PeriodType.ONE_DAY },
			{
				scenario: "ONE_WEEK",
				input: "ONE_WEEK",
				expected: PeriodType.ONE_WEEK,
			},
			{
				scenario: "ONE_MONTH",
				input: "ONE_MONTH",
				expected: PeriodType.ONE_MONTH,
			},
			{
				scenario: "with whitespace",
				input: "  ONE_DAY  ",
				expected: PeriodType.ONE_DAY,
			},
		])("should return the singleton instance for $scenario", ({
			input,
			expected,
		}) => {
			const result = PeriodType.of(input);
			expect(result).toBe(expected);
		});

		it("should return InvalidPeriodTypeError for unknown value", () => {
			const result = PeriodType.of("UNKNOWN");
			expect(result).toBeInstanceOf(InvalidPeriodTypeError);
			if (result instanceof InvalidPeriodTypeError) {
				expect(result.code).toBe(DomainErrorCode.PERIOD_TYPE_INVALID);
			}
		});

		it("should return InvalidPeriodTypeError for empty string", () => {
			const result = PeriodType.of("");
			expect(result).toBeInstanceOf(InvalidPeriodTypeError);
		});
	});

	describe("isEligibleForReset()", () => {
		it("should return true for ONE_DAY on any date", () => {
			expect(
				PeriodType.ONE_DAY.isEligibleForReset(new Date("2026-05-05")),
			).toBe(true);
		});

		it("should return true for ONE_WEEK only on Monday", () => {
			expect(
				PeriodType.ONE_WEEK.isEligibleForReset(new Date("2026-05-04")),
			).toBe(true);
			expect(
				PeriodType.ONE_WEEK.isEligibleForReset(new Date("2026-05-05")),
			).toBe(false);
		});

		it("should return true for ONE_MONTH only on the 1st", () => {
			expect(
				PeriodType.ONE_MONTH.isEligibleForReset(new Date("2026-05-01")),
			).toBe(true);
			expect(
				PeriodType.ONE_MONTH.isEligibleForReset(new Date("2026-05-15")),
			).toBe(false);
		});
	});

	describe("equals()", () => {
		it("should return true for the same type", () => {
			expect(PeriodType.ONE_DAY.equals(PeriodType.ONE_DAY)).toBe(true);
		});

		it("should return false for different types", () => {
			expect(PeriodType.ONE_DAY.equals(PeriodType.ONE_WEEK)).toBe(false);
		});
	});
});
