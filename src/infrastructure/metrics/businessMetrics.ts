import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("threshold-service");

export const thresholdCreationsTotal = meter.createCounter(
	"threshold_creations_total",
	{
		description: "Total number of threshold creations",
	},
);

export const thresholdUpdatesTotal = meter.createCounter(
	"threshold_updates_total",
	{
		description: "Total number of threshold updates",
	},
);

export const thresholdDeletionsTotal = meter.createCounter(
	"threshold_deletions_total",
	{
		description: "Total number of threshold deletions",
	},
);

export const thresholdBreachesTotal = meter.createCounter(
	"threshold_breaches_total",
	{
		description: "Total number of threshold breach events",
	},
);

export const thresholdDlqPublishesTotal = meter.createCounter(
	"threshold_dlq_publishes_total",
	{
		description: "Total number of messages published to the threshold DLQ",
	},
);
