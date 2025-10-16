import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";

export const thresholdFactory = {
  validActual: (overrides = {}) => ({
    utilityType: UtilityType.ELECTRICITY,
    thresholdType: ThresholdType.ACTUAL,
    value: 100,
    isActive: true,
    ...overrides,
  }),

  validHistorical: (overrides = {}) => ({
    utilityType: UtilityType.GAS,
    thresholdType: ThresholdType.HISTORICAL,
    periodType: PeriodType.ONE_MONTH,
    value: 200,
    isActive: true,
    ...overrides,
  }),

  validForecast: (overrides = {}) => ({
    utilityType: UtilityType.WATER,
    thresholdType: ThresholdType.FORECAST,
    periodType: PeriodType.ONE_WEEK,
    value: 150,
    isActive: false,
    ...overrides,
  }),

  invalid: {
    negativeValue: () => ({
      utilityType: UtilityType.ELECTRICITY,
      thresholdType: ThresholdType.ACTUAL,
      value: -10,
      isActive: true,
    }),

    actualWithPeriod: () => ({
      utilityType: UtilityType.ELECTRICITY,
      thresholdType: ThresholdType.ACTUAL,
      periodType: PeriodType.ONE_DAY,
      value: 100,
      isActive: true,
    }),

    historicalWithoutPeriod: () => ({
      utilityType: UtilityType.GAS,
      thresholdType: ThresholdType.HISTORICAL,
      value: 200,
      isActive: true,
    }),

    missingRequiredFields: () => ({
      value: 100,
    }),
  },
};
