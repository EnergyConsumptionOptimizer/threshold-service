import { describe, it, expect } from "vitest";
import { ResourceType } from "@domain/value/ResourceType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { z } from "zod";
import {
  createThresholdSchema,
  listThresholdSchema,
  updateThresholdSchema,
} from "@presentation/schemas/thresholdSchemas";

describe("Threshold Schemas", () => {
  describe("createThresholdSchema", () => {
    it("should parse valid input", () => {
      const validInput = {
        resourceType: ResourceType.ELECTRICITY,
        periodType: PeriodType.DAILY,
        thresholdType: ThresholdType.ACTUAL,
        value: 100,
      };
      expect(() => createThresholdSchema.parse(validInput)).not.toThrow();
    });

    it("should reject invalid input", () => {
      const invalidInput = {
        resourceType: "INVALID",
        periodType: PeriodType.DAILY,
        thresholdType: ThresholdType.ACTUAL,
        value: 100,
      };
      expect(() => createThresholdSchema.parse(invalidInput)).toThrow(
        z.ZodError,
      );
    });
  });

  describe("updateThresholdSchema", () => {
    it("should parse valid value", () => {
      expect(() => updateThresholdSchema.parse({ value: 200 })).not.toThrow();
    });

    it("should reject invalid value", () => {
      expect(() =>
        updateThresholdSchema.parse({ value: "not-a-number" }),
      ).toThrow(z.ZodError);
    });
  });

  describe("listThresholdSchema", () => {
    it("should accept empty query", () => {
      expect(() => listThresholdSchema.parse({})).not.toThrow();
    });

    it("should parse valid partial filters", () => {
      expect(() =>
        listThresholdSchema.parse({
          resourceType: ResourceType.ELECTRICITY,
          periodType: PeriodType.DAILY,
        }),
      ).not.toThrow();
    });

    it("should parse valid filters", () => {
      expect(() =>
        listThresholdSchema.parse({
          resourceType: ResourceType.ELECTRICITY,
          periodType: PeriodType.DAILY,
          thresholdType: ThresholdType.ACTUAL,
        }),
      ).not.toThrow();
    });

    it("should reject invalid filters", () => {
      expect(() =>
        listThresholdSchema.parse({ resourceType: "INVALID" }),
      ).toThrow(z.ZodError);
    });
  });
});
