import { describe, expect, it } from "vitest";
import { ThresholdId } from "@domain/value/ThresholdId";
import { InvalidThresholdIdError } from "@domain/errors";

describe("ThresholdId", () => {
  const validUuid = "valid-id";

  it("should create from valid UUID", () => {
    const id = ThresholdId.of(validUuid);
    expect(id).toBeInstanceOf(ThresholdId);
  });

  it("should reject empty values", () => {
    expect(() => ThresholdId.of("")).toThrow(InvalidThresholdIdError);
    expect(() => ThresholdId.of("    ")).toThrow(InvalidThresholdIdError);
  });

  it("should compare equality", () => {
    const id1 = ThresholdId.of(validUuid);
    const id2 = ThresholdId.of(validUuid);

    expect(id1.equals(id2)).toBe(true);
  });

  it("should convert to string", () => {
    const id = ThresholdId.of(validUuid);
    expect(id.toString()).toBe(validUuid);
  });
});
