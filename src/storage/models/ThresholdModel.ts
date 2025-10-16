import { Document, model, Schema } from "mongoose";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";

export interface ThresholdDocument extends Document {
  readonly _id: string;
  readonly utilityType: string;
  readonly value: number;
  readonly thresholdType: string;
  readonly isActive: boolean;
  readonly periodType?: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

const thresholdSchema = new Schema<ThresholdDocument>(
  {
    _id: { type: String, required: true },
    utilityType: {
      type: String,
      enum: Object.values(UtilityType),
      required: true,
    },
    value: { type: Number, required: true, min: 0 },
    thresholdType: {
      type: String,
      enum: Object.values(ThresholdType),
      required: true,
    },
    isActive: { type: Boolean, required: true, default: true },
    periodType: {
      type: String,
      enum: Object.values(PeriodType),
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

thresholdSchema.index(
  { utilityType: 1, periodType: 1, thresholdType: 1 },
  { unique: true },
);

export const ThresholdModel = model<ThresholdDocument>(
  "Threshold",
  thresholdSchema,
);
