import { v4 as uuidv4 } from "uuid";
import type { ThresholdIdGeneratorPort } from "@domain/port/ThresholdIdGeneratorPort";
import { ThresholdId } from "@domain/value/ThresholdId";

/** Generate threshold IDs using UUID v4. */
export class UuidThresholdIdGeneratorAdapter implements ThresholdIdGeneratorPort {
  /** @returns A new unique threshold id. */
  nextId(): ThresholdId {
    return ThresholdId.of(uuidv4());
  }
}
