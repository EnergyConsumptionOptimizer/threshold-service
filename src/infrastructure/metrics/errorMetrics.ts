import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("threshold-service");

export const thresholdErrorsTotal = meter.createCounter(
	"threshold_errors_total",
	{
		description: "Total number of errors in threshold service",
	},
);
