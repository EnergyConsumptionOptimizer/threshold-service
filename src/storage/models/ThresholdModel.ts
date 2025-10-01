import { Schema, Document, model } from "mongoose";

export interface ThresholdDocument extends Document {
  _id: string;
  resourceType: string;
  periodType: string;
  thresholdType: string;
  value: number;
  businessKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const thresholdSchema = new Schema<ThresholdDocument>(
  {
    _id: { type: String, required: true },
    resourceType: { type: String, required: true, index: true },
    periodType: { type: String, required: true },
    thresholdType: { type: String, required: true },
    value: { type: Number, required: true, min: 0 },
    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
  },
  {
    versionKey: false,
    _id: false,
    collection: "thresholds",
  },
);

thresholdSchema.index(
  { resourceType: 1, periodType: 1, thresholdType: 1 },
  { unique: true },
);

export const ThresholdModel = model<ThresholdDocument>(
  "Threshold",
  thresholdSchema,
);
