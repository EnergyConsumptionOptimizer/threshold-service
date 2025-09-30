import { describe, it, expect, vi } from "vitest";
import { Threshold } from "@domain/Threshold";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { InvalidThresholdValueError } from "@domain/errors";

vi.stubGlobal("crypto", { randomUUID: () => "mock-uuid" });

describe("Threshold Entity", () => {
  const validParams = {
    resourceType: ResourceType.ELECTRICITY,
    periodType: PeriodType.DAILY,
    thresholdType: ThresholdType.ACTUAL,
    value: 100,
  };

  describe("Creation", () => {
    it("should create valid threshold", () => {
      const threshold = Threshold.create(validParams);

      expect(threshold.getBusinessKey()).toBe("electricity-daily-actual");
      expect(threshold.isExceededBy(150)).toBe(true);
      expect(threshold.isExceededBy(50)).toBe(false);
    });

    it("should reject invalid values", () => {
      expect(() => Threshold.create({ ...validParams, value: 0 })).toThrow(
        InvalidThresholdValueError,
      );
      expect(() => Threshold.create({ ...validParams, value: -10 })).toThrow(
        InvalidThresholdValueError,
      );
    });
  });

  describe("Business Operations", () => {
    it("should update value while preserving identity", () => {
      const original = Threshold.create(validParams);
      const updated = original.updateValue(200);

      expect(updated.isExceededBy(250)).toBe(true);
      expect(updated.isExceededBy(150)).toBe(false);
      expect(updated.getBusinessKey()).toBe(original.getBusinessKey());

      // Original unchanged
      expect(original.isExceededBy(150)).toBe(true);
    });

    it("should reject invalid value updates", () => {
      const threshold = Threshold.create(validParams);

      expect(() => threshold.updateValue(0)).toThrow(
        InvalidThresholdValueError,
      );
    });
  });

  describe("Reconstitution", () => {
    it("should restore from persisted data", () => {
      const threshold = Threshold.reconstitute({
        id: "123e4567-e89b-12d3-a456-426614174000",
        ...validParams,
        value: 150,
        createdAt: new Date("2025-01-01"),
        updatedAt: new Date("2025-01-02"),
      });

      expect(threshold.isExceededBy(200)).toBe(true);
      expect(threshold.getBusinessKey()).toBe("electricity-daily-actual");
    });
  });
});
