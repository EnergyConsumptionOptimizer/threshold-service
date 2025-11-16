import { describe, expect, it } from "vitest";
import { UtilityType } from "@domain/value/UtilityType";

describe("UtilityType", () => {
  it("should have correct enum values", () => {
    expect(UtilityType.ELECTRICITY).toBe("ELECTRICITY");
    expect(UtilityType.GAS).toBe("GAS");
    expect(UtilityType.WATER).toBe("WATER");
  });
});
