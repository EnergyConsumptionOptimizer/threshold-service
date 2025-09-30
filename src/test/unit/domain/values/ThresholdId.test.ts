import { describe, it, expect } from "vitest";
import { validate } from "uuid";
import { ThresholdId } from "@domain/value/ThresholdId";
import { DomainError } from "@domain/errors";

describe("ThresholdId", () => {
  const validUuid = "123e4567-e89b-12d3-a456-426614174000";

  it("should generate valid UUID", () => {
    const id = ThresholdId.generate();
    expect(validate(id.value)).toBe(true);
  });

  it("should create from valid UUID", () => {
    const id = ThresholdId.of(validUuid);
    expect(id.value).toBe(validUuid);
  });

  it("should reject invalid values", () => {
    expect(() => ThresholdId.of("")).toThrow(DomainError);
    expect(() => ThresholdId.of("invalid")).toThrow(DomainError);
  });

  it("should compare equality", () => {
    const id1 = ThresholdId.of(validUuid);
    const id2 = ThresholdId.of(validUuid);

    expect(id1.equals(id2)).toBe(true);
    expect(id1.equals(ThresholdId.generate())).toBe(false);
  });

  it("should convert to string", () => {
    const id = ThresholdId.of(validUuid);
    expect(id.toString()).toBe(validUuid);
  });
});
