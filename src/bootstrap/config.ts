import { z } from "zod";

export const EnvSchema = z.object({
	PORT: z.coerce.number().default(3000),
	MONGODB_HOST: z.string().default("localhost"),
	MONGODB_PORT: z.coerce.number().default(27017),
	MONGO_DB: z.string().default("threshold"),
	KAFKA_CLIENT_ID: z.string().default("threshold-service"),
	KAFKA_BOOTSTRAP_SERVERS: z.string().default("kafka:9092"),
	KAFKA_GROUP_ID: z.string().default("threshold-service-group"),
	KAFKA_TOPIC_FORECASTS: z.string().default("forecast-events"),
	KAFKA_TOPIC_FORECASTS_DLQ: z.string().default("threshold-dlq"),
	MONITORING_SERVICE_HOST: z.string().default("monitoring"),
	MONITORING_SERVICE_PORT: z.coerce.number().default(3000),
	LOG_LEVEL: z
		.enum(["trace", "debug", "info", "warn", "error", "fatal"])
		.default("info"),
	NAME: z.string().default("threshold-service"),
});

const result = EnvSchema.safeParse(process.env);

if (!result.success) {
	console.error(
		"Invalid environment configuration:",
		JSON.stringify(result.error.issues, null, 2),
	);
	process.exit(1);
}

const env = result.data;

export const config = {
	port: env.PORT,
	mongo: {
		uri: `mongodb://${env.MONGODB_HOST}:${env.MONGODB_PORT}/${env.MONGO_DB}`,
	},
	kafka: {
		clientId: env.KAFKA_CLIENT_ID,
		brokers: env.KAFKA_BOOTSTRAP_SERVERS.split(","),
		groupId: env.KAFKA_GROUP_ID,
		topics: {
			forecasts: env.KAFKA_TOPIC_FORECASTS,
			forecastsDlq: env.KAFKA_TOPIC_FORECASTS_DLQ,
		},
	},
	monitoringServiceUrl: `http://${env.MONITORING_SERVICE_HOST}:${env.MONITORING_SERVICE_PORT}`,
	logLevel: env.LOG_LEVEL,
	appName: env.NAME,
} as const;

export type Config = typeof config;
