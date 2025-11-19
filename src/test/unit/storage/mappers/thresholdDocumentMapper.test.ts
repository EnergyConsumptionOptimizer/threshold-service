import { describe, expect, it } from "vitest";
import { ThresholdId } from "@domain/value/ThresholdId";
import { Threshold } from "@domain/Threshold";
import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdValue } from "@domain/value/ThresholdValue";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";
import {
  toDomain,
  toPersistence,
} from "@storage/mappers/thresholdDocumentMapper";

describe("Threshold Document Mapper", () => {
  const mockThreshold = Threshold.create(
    ThresholdId.of("123"),
    UtilityType.GAS,
    ThresholdValue.of(10),
    ThresholdType.FORECAST,
    ThresholdState.ENABLED,
    PeriodType.ONE_DAY,
  );

  const mockDoc = {
    _id: "123",
    utilityType: "GAS",
    thresholdType: "FORECAST",
    periodType: "ONE_DAY",
    value: 10,
    thresholdState: "ENABLED",
  };

  it("toPersistence converts domain to MongoDB document", () => {
    const persistence = toPersistence(mockThreshold);
    expect(persistence).toEqual({
      utilityType: "GAS",
      thresholdType: "FORECAST",
      periodType: "ONE_DAY",
      value: 10,
      thresholdState: "ENABLED",
    });
  });

  it("toDomain converts MongoDB document to domain entity", () => {
    const domain = toDomain(mockDoc);
    expect(domain.id.value).toBe("123");
    expect(domain.utilityType).toBe("GAS");
    expect(domain.value.valueOf()).toBe(10);
    expect(domain.thresholdType).toBe("FORECAST");
    expect(domain.periodType).toBe("ONE_DAY");
    expect(domain.thresholdState).toBe("ENABLED");
  });
});
