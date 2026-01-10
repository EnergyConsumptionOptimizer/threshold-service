import type { ThresholdId } from "@domain/value/ThresholdId";

/** Generates new domain IDs without leaking infrastructure concerns into the domain. */
export interface ThresholdIdGeneratorPort {
  nextId(): ThresholdId;
}
