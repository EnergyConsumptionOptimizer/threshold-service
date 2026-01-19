import type { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";
import { ThresholdType } from "@domain/value/ThresholdType";
import type { PeriodType } from "@domain/value/PeriodType";
import type { UtilityType } from "@domain/value/UtilityType";
import type { Threshold } from "@domain/Threshold";

/** Describe one forecast aggregation for a given period. */
export interface ForecastAggregation {
  periodType: PeriodType;
  value: number;
}

/** Evaluate a set of forecast aggregations against FORECAST thresholds. */
export class EvaluateForecastUseCase {
  constructor(
    private readonly evaluationService: ConsumptionEvaluationService,
  ) {}

  /**
   * Evaluate forecast aggregations.
   * @returns The breached thresholds across all aggregations.
   */
  async execute(input: {
    utilityType: UtilityType;
    aggregations: ForecastAggregation[];
  }): Promise<Threshold[]> {
    const resultsPerAggregation = await Promise.all(
      input.aggregations.map((a) =>
        this.evaluationService.evaluate({
          utilityType: input.utilityType,
          thresholdType: ThresholdType.FORECAST,
          periodType: a.periodType,
          value: a.value,
        }),
      ),
    );

    return resultsPerAggregation.flat();
  }
}
