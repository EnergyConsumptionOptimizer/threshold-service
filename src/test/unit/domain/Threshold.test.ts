import { describe, expect, it } from "vitest";

import { ThresholdId } from "@domain/value/ThresholdId";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { Threshold } from "@domain/Threshold";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import {
  ActualThresholdWithPeriodError,
  MissingPeriodTypeForThresholdError,
} from "@domain/errors";
import { ThresholdState } from "@domain/value/ThresholdState";

describe("Threshold", () => {
  const validId = ThresholdId.of("valid-id");
  const validUtilityType = UtilityType.ELECTRICITY;
  const validValue = ThresholdValue.of(100);

  describe("create", () => {
    it("should create a valid ACTUAL threshold without period", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.ACTUAL,
        ThresholdState.ENABLED,
      );

      expect(threshold.id).toBe(validId);
      expect(threshold.utilityType).toBe(validUtilityType);
      expect(threshold.value).toBe(validValue);
      expect(threshold.thresholdType).toBe(ThresholdType.ACTUAL);
      expect(threshold.thresholdState).toBe(ThresholdState.ENABLED);
      expect(threshold.periodType).toBeUndefined();
    });

    it("should create a valid HISTORICAL threshold with period", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.HISTORICAL,
        ThresholdState.ENABLED,
        PeriodType.ONE_MONTH,
      );

      expect(threshold.thresholdType).toBe(ThresholdType.HISTORICAL);
      expect(threshold.periodType).toBe(PeriodType.ONE_MONTH);
    });

    it("should create a valid FORECAST threshold with period", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.FORECAST,
        ThresholdState.DISABLED,
        PeriodType.ONE_DAY,
      );

      expect(threshold.thresholdType).toBe(ThresholdType.FORECAST);
      expect(threshold.periodType).toBe(PeriodType.ONE_DAY);
    });
  });

  describe("validation", () => {
    it("should throw when ACTUAL threshold has period", () => {
      expect(() =>
        Threshold.create(
          validId,
          validUtilityType,
          validValue,
          ThresholdType.ACTUAL,
          ThresholdState.ENABLED,
          PeriodType.ONE_MONTH,
        ),
      ).toThrow(ActualThresholdWithPeriodError);
    });

    it("should throw when HISTORICAL threshold lacks period", () => {
      expect(() =>
        Threshold.create(
          validId,
          validUtilityType,
          validValue,
          ThresholdType.HISTORICAL,
          ThresholdState.ENABLED,
        ),
      ).toThrow(MissingPeriodTypeForThresholdError);
    });

    it("should throw when FORECAST threshold lacks period", () => {
      expect(() =>
        Threshold.create(
          validId,
          validUtilityType,
          validValue,
          ThresholdType.FORECAST,
          ThresholdState.ENABLED,
        ),
      ).toThrow(MissingPeriodTypeForThresholdError);
    });
  });

  describe("update", () => {
    it("should update single attribute preserving others", () => {
      const original = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.ACTUAL,
        ThresholdState.ENABLED,
      );

      const updated = original.update({
        thresholdState: ThresholdState.DISABLED,
      });

      expect(updated.id).toBe(validId);
      expect(updated.thresholdState).toBe(ThresholdState.DISABLED);
      expect(updated.thresholdType).toBe(ThresholdType.ACTUAL);
    });

    it("should update multiple attributes", () => {
      const original = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.HISTORICAL,
        ThresholdState.ENABLED,
        PeriodType.ONE_MONTH,
      );

      const newValue = ThresholdValue.of(200);
      const updated = original.update({
        value: newValue,
        thresholdState: ThresholdState.DISABLED,
      });

      expect(updated.value).toBe(newValue);
      expect(updated.thresholdState).toBe(ThresholdState.DISABLED);
      expect(updated.periodType).toBe(PeriodType.ONE_MONTH);
    });

    it("should validate updated threshold", () => {
      const original = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.HISTORICAL,
        ThresholdState.ENABLED,
        PeriodType.ONE_MONTH,
      );

      expect(() =>
        original.update({
          thresholdType: ThresholdType.ACTUAL,
        }),
      ).toThrow(ActualThresholdWithPeriodError);
    });

    it("should return new instance on update", () => {
      const original = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.ACTUAL,
        ThresholdState.ENABLED,
      );

      const updated = original.update({
        thresholdState: ThresholdState.DISABLED,
      });

      expect(updated).not.toBe(original);
      expect(original.thresholdState).toBe(ThresholdState.ENABLED);
    });
  });

  describe("check()", () => {
    it("should not breach when DISABLED", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.ACTUAL,
        ThresholdState.DISABLED,
      );

      const result = threshold.check(999); // anche se supera, non deve cambiare stato

      expect(result.thresholdState).toBe(ThresholdState.DISABLED);
    });

    it("should set state to BREACHED when value is exceeded", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.ACTUAL,
        ThresholdState.ENABLED,
      );

      const result = threshold.check(200);

      expect(result.thresholdState).toBe(ThresholdState.BREACHED);
    });

    it("should remain ENABLED if not breached", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        ThresholdValue.of(300),
        ThresholdType.ACTUAL,
        ThresholdState.ENABLED,
      );

      const result = threshold.check(100);

      expect(result.thresholdState).toBe(ThresholdState.ENABLED);
    });
  });
});
