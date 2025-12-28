import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";

export const thresholdFactory = {
  validActual: (overrides = {}) => ({
    name: "validActualThreshold",
    utilityType: UtilityType.ELECTRICITY,
    thresholdType: ThresholdType.ACTUAL,
    value: 100,
    thresholdState: ThresholdState.ENABLED,
    ...overrides,
  }),

  validHistorical: (overrides = {}) => ({
    name: "validHistoricalThreshold",
    utilityType: UtilityType.GAS,
    thresholdType: ThresholdType.HISTORICAL,
    periodType: PeriodType.ONE_MONTH,
    value: 200,
    thresholdState: ThresholdState.ENABLED,
    ...overrides,
  }),

  validForecast: (overrides = {}) => ({
    name: "validForecastThreshold",
    utilityType: UtilityType.WATER,
    thresholdType: ThresholdType.FORECAST,
    periodType: PeriodType.ONE_WEEK,
    value: 150,
    thresholdState: ThresholdState.DISABLED,
    ...overrides,
  }),

  invalid: {
    negativeValue: () => ({
      name: "negativeValueThreshold",
      utilityType: UtilityType.ELECTRICITY,
      thresholdType: ThresholdType.ACTUAL,
      value: -10,
      thresholdState: ThresholdState.ENABLED,
    }),

    actualWithPeriod: () => ({
      name: "actualWithPeriodThreshold",
      utilityType: UtilityType.ELECTRICITY,
      thresholdType: ThresholdType.ACTUAL,
      periodType: PeriodType.ONE_DAY,
      value: 100,
      thresholdState: ThresholdState.ENABLED,
    }),

    historicalWithoutPeriod: () => ({
      name: "historicalWithoutPeriodThreshold",
      utilityType: UtilityType.GAS,
      thresholdType: ThresholdType.HISTORICAL,
      value: 200,
      thresholdState: ThresholdState.ENABLED,
    }),

    missingRequiredFields: () => ({
      value: 100,
    }),
  },
};
