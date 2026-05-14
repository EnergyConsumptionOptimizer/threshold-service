import { PeriodType } from "@domain/value/PeriodType";
import { ThresholdStates } from "@domain/value/ThresholdState";
import { ThresholdTypes } from "@domain/value/ThresholdType";
import { UtilityTypes } from "@domain/value/UtilityType";
import { type InferSchemaType, model, Schema } from "mongoose";

const requiredEnum = (values: string[]) => ({
	type: String,
	enum: values,
	required: true,
});

const periodTypeValues = [
	PeriodType.ONE_DAY.value,
	PeriodType.ONE_WEEK.value,
	PeriodType.ONE_MONTH.value,
];

const thresholdSchema = new Schema(
	{
		_id: { type: String, required: true },
		name: { type: String, required: true },
		utilityType: requiredEnum(Object.values(UtilityTypes)),
		value: { type: Number, required: true, min: 0 },
		thresholdType: requiredEnum(Object.values(ThresholdTypes)),
		thresholdState: requiredEnum(Object.values(ThresholdStates)),
		periodType: {
			type: String,
			enum: periodTypeValues,
		},
	},
	{
		timestamps: true,
		versionKey: false,
	},
);

thresholdSchema.index({ name: 1 }, { unique: true });

export type ThresholdDoc = InferSchemaType<typeof thresholdSchema>;

export const ThresholdModel = model<ThresholdDoc>("Threshold", thresholdSchema);
