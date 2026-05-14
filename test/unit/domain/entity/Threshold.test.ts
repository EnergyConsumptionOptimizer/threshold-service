import { Threshold } from "@domain/entity/Threshold";
import {
	ActualThresholdWithPeriodError,
	MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import { ThresholdBreachedEvent } from "@domain/events/ThresholdBreachedEvent";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdStates } from "@domain/value/ThresholdState";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import {
	aNewThreshold,
	aThreshold,
	validId,
	validName,
	validValue,
} from "@test/domainFactories";
import { describe, expect, it } from "vitest";

describe("Threshold Entity", () => {
	describe("create()", () => {
		it("should create a threshold with ENABLED state", () => {
			const id = validId();
			const name = validName();
			const value = validValue();

			const threshold = Threshold.create(
				id,
				name,
				UtilityTypes.GAS,
				value,
				ThresholdTypes.ACTUAL,
			) as Threshold;

			expect(threshold).toBeInstanceOf(Threshold);
			expect(threshold.id).toBe(id);
			expect(threshold.name).toBe(name);
			expect(threshold.utilityType).toBe(UtilityTypes.GAS);
			expect(threshold.value).toBe(value);
			expect(threshold.thresholdType).toBe(ThresholdTypes.ACTUAL);
			expect(threshold.thresholdState).toBe(ThresholdStates.ENABLED);
			expect(threshold.periodType).toBeUndefined();
			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});

		it("should create a HISTORICAL threshold with period type", () => {
			const threshold = Threshold.create(
				validId("t2"),
				validName("Gas Historical"),
				UtilityTypes.GAS,
				validValue(200),
				ThresholdTypes.HISTORICAL,
				PeriodType.ONE_DAY,
			) as Threshold;

			expect(threshold.thresholdType).toBe(ThresholdTypes.HISTORICAL);
			expect(threshold.periodType).toBe(PeriodType.ONE_DAY);
		});

		it("should return ActualThresholdWithPeriodError when ACTUAL has period", () => {
			const result = Threshold.create(
				validId("t3"),
				validName("Bad Actual"),
				UtilityTypes.WATER,
				validValue(50),
				ThresholdTypes.ACTUAL,
				PeriodType.ONE_DAY,
			);

			expect(result).toBeInstanceOf(ActualThresholdWithPeriodError);
		});

		it("should return MissingPeriodTypeForThresholdError when HISTORICAL lacks period", () => {
			const result = Threshold.create(
				validId("t4"),
				validName("No Period"),
				UtilityTypes.ELECTRICITY,
				validValue(150),
				ThresholdTypes.HISTORICAL,
			);

			expect(result).toBeInstanceOf(MissingPeriodTypeForThresholdError);
		});

		it("should return MissingPeriodTypeForThresholdError when FORECAST lacks period", () => {
			const result = Threshold.create(
				validId("t5"),
				validName("No Period Forecast"),
				UtilityTypes.WATER,
				validValue(75),
				ThresholdTypes.FORECAST,
			);

			expect(result).toBeInstanceOf(MissingPeriodTypeForThresholdError);
		});
	});

	describe("restore()", () => {
		it("should restore a threshold without emitting domain events", () => {
			const threshold = Threshold.restore(
				validId(),
				validName(),
				UtilityTypes.ELECTRICITY,
				validValue(),
				ThresholdTypes.HISTORICAL,
				ThresholdStates.DISABLED,
				PeriodType.ONE_WEEK,
			);

			expect(threshold).toBeInstanceOf(Threshold);
			expect(threshold.thresholdState).toBe(ThresholdStates.DISABLED);
			expect(threshold.periodType).toBe(PeriodType.ONE_WEEK);
			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});
	});

	describe("check()", () => {
		it("should breach and change state when value is exceeded", () => {
			const threshold = aNewThreshold({
				value: validValue(100),
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			threshold.check(150);

			expect(threshold.thresholdState).toBe(ThresholdStates.BREACHED);
		});

		it("should emit ThresholdBreachedEvent on breach", () => {
			const threshold = aNewThreshold({
				value: validValue(100),
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			threshold.check(150);

			const events = threshold.pullDomainEvents();
			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(ThresholdBreachedEvent);
			expect((events[0] as ThresholdBreachedEvent).payload).toMatchObject({
				thresholdId: threshold.id.value,
				thresholdName: threshold.name.value,
				limitValue: 100,
				detectedValue: 150,
			});
		});

		it("should do nothing when threshold is disabled", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.DISABLED,
			});

			threshold.check(150);

			expect(threshold.thresholdState).toBe(ThresholdStates.DISABLED);
			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});

		it("should do nothing when value is not exceeded", () => {
			const threshold = aNewThreshold({
				value: validValue(100),
			});

			threshold.check(50);

			expect(threshold.thresholdState).toBe(ThresholdStates.ENABLED);
			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});

		it("should do nothing when value equals the limit", () => {
			const threshold = aNewThreshold({
				value: validValue(100),
			});

			threshold.check(100);

			expect(threshold.thresholdState).toBe(ThresholdStates.ENABLED);
			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});

		it("should do nothing when already breached", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.BREACHED,
			});

			threshold.check(200);

			expect(threshold.thresholdState).toBe(ThresholdStates.BREACHED);
		});
	});

	describe("changeName()", () => {
		it("should update the threshold name", () => {
			const threshold = aNewThreshold();
			const newName = validName("Updated Name");

			threshold.changeName(newName);

			expect(threshold.name).toBe(newName);
		});
	});

	describe("changeValue()", () => {
		it("should update the threshold value", () => {
			const threshold = aNewThreshold();
			const newValue = validValue(200);

			threshold.changeValue(newValue);

			expect(threshold.value).toBe(newValue);
		});
	});

	describe("changeUtilityType()", () => {
		it("should update the utility type", () => {
			const threshold = aNewThreshold();

			threshold.changeUtilityType(UtilityTypes.WATER);

			expect(threshold.utilityType).toBe(UtilityTypes.WATER);
		});
	});

	describe("changeType()", () => {
		it("should update both threshold type and period type", () => {
			const threshold = aNewThreshold({
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			threshold.changeType(ThresholdTypes.FORECAST, PeriodType.ONE_WEEK);

			expect(threshold.thresholdType).toBe(ThresholdTypes.FORECAST);
			expect(threshold.periodType).toBe(PeriodType.ONE_WEEK);
		});

		it("should return error when setting ACTUAL with a period", () => {
			const threshold = aNewThreshold({
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			const result = threshold.changeType(
				ThresholdTypes.ACTUAL,
				PeriodType.ONE_DAY,
			);

			expect(result).toBeInstanceOf(ActualThresholdWithPeriodError);
		});

		it("should return error when setting type requiring period without one", () => {
			const threshold = aNewThreshold({
				thresholdType: ThresholdTypes.ACTUAL,
				periodType: undefined,
			});

			const result = threshold.changeType(ThresholdTypes.HISTORICAL, undefined);

			expect(result).toBeInstanceOf(MissingPeriodTypeForThresholdError);
		});

		it("should accept removing period from ACTUAL type", () => {
			const threshold = aNewThreshold({
				thresholdType: ThresholdTypes.ACTUAL,
				periodType: undefined,
			});

			const result = threshold.changeType(ThresholdTypes.ACTUAL, undefined);

			expect(result).toBeUndefined();
			expect(threshold.periodType).toBeUndefined();
		});
	});

	describe("enable()", () => {
		it("should set state to ENABLED", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.DISABLED,
			});

			threshold.enable();

			expect(threshold.thresholdState).toBe(ThresholdStates.ENABLED);
		});
	});

	describe("disable()", () => {
		it("should set state to DISABLED", () => {
			const threshold = aNewThreshold();

			threshold.disable();

			expect(threshold.thresholdState).toBe(ThresholdStates.DISABLED);
		});
	});

	describe("reset()", () => {
		it("should set state to ENABLED when breached", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.BREACHED,
			});

			threshold.reset();

			expect(threshold.thresholdState).toBe(ThresholdStates.ENABLED);
		});

		it("should do nothing when already enabled", () => {
			const threshold = aNewThreshold();

			threshold.reset();

			expect(threshold.thresholdState).toBe(ThresholdStates.ENABLED);
		});

		it("should do nothing when disabled", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.DISABLED,
			});

			threshold.reset();

			expect(threshold.thresholdState).toBe(ThresholdStates.DISABLED);
		});
	});

	describe("canReset()", () => {
		it("should return true when breached and period is ONE_DAY", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.BREACHED,
				periodType: PeriodType.ONE_DAY,
			});

			expect(threshold.canReset(new Date("2026-05-05"))).toBe(true);
		});

		it("should return true when breached and ONE_WEEK on Monday", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.BREACHED,
				periodType: PeriodType.ONE_WEEK,
			});

			expect(threshold.canReset(new Date("2026-05-04"))).toBe(true);
		});

		it("should return false when breached but ONE_WEEK on Tuesday", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.BREACHED,
				periodType: PeriodType.ONE_WEEK,
			});

			expect(threshold.canReset(new Date("2026-05-05"))).toBe(false);
		});

		it("should return false when not breached even if period is eligible", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.ENABLED,
				periodType: PeriodType.ONE_DAY,
			});

			expect(threshold.canReset(new Date("2026-05-05"))).toBe(false);
		});

		it("should return false when disabled", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.DISABLED,
				periodType: PeriodType.ONE_DAY,
			});

			expect(threshold.canReset(new Date("2026-05-05"))).toBe(false);
		});

		it("should return false when breached but period is undefined", () => {
			const threshold = aThreshold({
				thresholdState: ThresholdStates.BREACHED,
				periodType: undefined,
			});

			expect(threshold.canReset(new Date("2026-05-01"))).toBe(false);
		});
	});

	describe("equals()", () => {
		it("should return true for thresholds with the same id", () => {
			const id = validId();
			const t1 = Threshold.restore(
				id,
				validName("A"),
				UtilityTypes.ELECTRICITY,
				validValue(10),
				ThresholdTypes.ACTUAL,
				ThresholdStates.ENABLED,
			);
			const t2 = Threshold.restore(
				id,
				validName("B"),
				UtilityTypes.GAS,
				validValue(20),
				ThresholdTypes.HISTORICAL,
				ThresholdStates.BREACHED,
				PeriodType.ONE_DAY,
			);

			expect(t1.equals(t2)).toBe(true);
		});

		it("should return false for thresholds with different ids", () => {
			const t1 = Threshold.restore(
				validId("id-1"),
				validName("A"),
				UtilityTypes.ELECTRICITY,
				validValue(10),
				ThresholdTypes.ACTUAL,
				ThresholdStates.ENABLED,
			);
			const t2 = Threshold.restore(
				validId("id-2"),
				validName("B"),
				UtilityTypes.GAS,
				validValue(20),
				ThresholdTypes.ACTUAL,
				ThresholdStates.ENABLED,
			);

			expect(t1.equals(t2)).toBe(false);
		});
	});

	describe("pullDomainEvents()", () => {
		it("should return no events from create", () => {
			const threshold = aNewThreshold({
				value: validValue(50),
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});

		it("should return ThresholdBreachedEvent after breach and clear after pull", () => {
			const threshold = aNewThreshold({
				value: validValue(50),
				thresholdType: ThresholdTypes.HISTORICAL,
				periodType: PeriodType.ONE_DAY,
			});

			threshold.check(80);
			const events = threshold.pullDomainEvents();

			expect(events).toHaveLength(1);
			expect(events[0]).toBeInstanceOf(ThresholdBreachedEvent);
			expect(threshold.pullDomainEvents()).toHaveLength(0);
		});
	});
});
