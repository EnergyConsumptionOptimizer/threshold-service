import { Document, model, Schema } from "mongoose";
import { UtilityType } from "@domain/value/UtilityType";
import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdType } from "@domain/value/ThresholdType";
import { ThresholdState } from "@domain/value/ThresholdState";

export interface ThresholdDocument extends Document {
  readonly _id: string;
  readonly utilityType: string;
  readonly value: number;
  readonly thresholdType: string;
  readonly thresholdState: string;
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
    thresholdState: {
      type: String,
      enum: Object.values(ThresholdState),
      required: true,
    },
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
