import { UtilityType } from "@domain/value/UtilityType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdState } from "@domain/value/ThresholdState";

export const thresholdFactory = {
  validActual: (overrides = {}) => ({
    utilityType: UtilityType.ELECTRICITY,
    thresholdType: ThresholdType.ACTUAL,
    value: 100,
    thresholdState: ThresholdState.ENABLED,
    ...overrides,
  }),

  validHistorical: (overrides = {}) => ({
    utilityType: UtilityType.GAS,
    thresholdType: ThresholdType.HISTORICAL,
    periodType: PeriodType.ONE_MONTH,
    value: 200,
    thresholdState: ThresholdState.ENABLED,
    ...overrides,
  }),

  validForecast: (overrides = {}) => ({
    utilityType: UtilityType.WATER,
    thresholdType: ThresholdType.FORECAST,
    periodType: PeriodType.ONE_WEEK,
    value: 150,
    thresholdState: ThresholdState.DISABLED,
    ...overrides,
  }),

  invalid: {
    negativeValue: () => ({
      utilityType: UtilityType.ELECTRICITY,
      thresholdType: ThresholdType.ACTUAL,
      value: -10,
      thresholdState: ThresholdState.ENABLED,
    }),

    actualWithPeriod: () => ({
      utilityType: UtilityType.ELECTRICITY,
      thresholdType: ThresholdType.ACTUAL,
      periodType: PeriodType.ONE_DAY,
      value: 100,
      thresholdState: ThresholdState.ENABLED,
    }),

    historicalWithoutPeriod: () => ({
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
