import { describe, expect, it } from "vitest";

import { ThresholdId } from "src/domain/value/ThresholdId";
import { UtilityType } from "src/domain/value/UtilityType";
import { ThresholdValue } from "src/domain/value/ThresholdValue";
import { ThresholdType } from "src/domain/value/ThresholdType";
import { PeriodType } from "src/domain/value/PeriodType";
import {
  ActualThresholdWithPeriodError,
  MissingPeriodTypeForThresholdError,
} from "src/domain/errors";
import { Threshold } from "src/domain/Threshold";

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
        true,
      );

      expect(threshold.id).toBe(validId);
      expect(threshold.utilityType).toBe(validUtilityType);
      expect(threshold.value).toBe(validValue);
      expect(threshold.thresholdType).toBe(ThresholdType.ACTUAL);
      expect(threshold.isActive).toBe(true);
      expect(threshold.periodType).toBeUndefined();
    });

    it("should create a valid HISTORICAL threshold with period", () => {
      const threshold = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.HISTORICAL,
        true,
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
        false,
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
          true,
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
          true,
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
          true,
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
        true,
      );

      const updated = original.update({ isActive: false });

      expect(updated.id).toBe(validId);
      expect(updated.isActive).toBe(false);
      expect(updated.thresholdType).toBe(ThresholdType.ACTUAL);
    });

    it("should update multiple attributes", () => {
      const original = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.HISTORICAL,
        true,
        PeriodType.ONE_MONTH,
      );

      const newValue = ThresholdValue.of(200);
      const updated = original.update({
        value: newValue,
        isActive: false,
      });

      expect(updated.value).toBe(newValue);
      expect(updated.isActive).toBe(false);
      expect(updated.periodType).toBe(PeriodType.ONE_MONTH);
    });

    it("should validate updated threshold", () => {
      const original = Threshold.create(
        validId,
        validUtilityType,
        validValue,
        ThresholdType.HISTORICAL,
        true,
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
        true,
      );

      const updated = original.update({ isActive: false });

      expect(updated).not.toBe(original);
      expect(original.isActive).toBe(true);
    });
  });
});
