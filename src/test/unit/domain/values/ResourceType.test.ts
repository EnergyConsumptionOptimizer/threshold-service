import { describe, it, expect } from "vitest";
import { ResourceType } from "@domain/value/ResourceType";

describe("ResourceType", () => {
  it("should have correct enum values", () => {
    expect(ResourceType.ELECTRICITY).toBe("electricity");
    expect(ResourceType.GAS).toBe("gas");
    expect(ResourceType.WATER).toBe("water");
  });

  it("should contain all expected resource types", () => {
    const values = Object.values(ResourceType);
    expect(values).toHaveLength(3);
    expect(values).toContain("electricity");
    expect(values).toContain("gas");
    expect(values).toContain("water");
  });
});
