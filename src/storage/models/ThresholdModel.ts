import { Document, model, Schema, InferSchemaType } from "mongoose";
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

const requiredEnum = (values: string[]) => ({
  type: String,
  enum: values,
  required: true,
});

const thresholdSchema = new Schema<ThresholdDocument>(
  {
    _id: { type: String, required: true },
    utilityType: requiredEnum(Object.values(UtilityType)),
    value: { type: Number, required: true, min: 0 },
    thresholdType: requiredEnum(Object.values(ThresholdType)),
    thresholdState: requiredEnum(Object.values(ThresholdState)),
    periodType: {
      type: String,
      enum: Object.values(PeriodType),
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

export type Threshold = InferSchemaType<typeof thresholdSchema>;

export const ThresholdModel = model<Threshold>("Threshold", thresholdSchema);
