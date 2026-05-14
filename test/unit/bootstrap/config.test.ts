import { EnvSchema } from "@bootstrap/config";
import { describe, expect, it } from "vitest";

describe("EnvSchema", () => {
	it("applies all defaults when given an empty object", () => {
		const result = EnvSchema.safeParse({});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.PORT).toBe(3000);
		expect(result.data.MONGODB_HOST).toBe("localhost");
		expect(result.data.MONGODB_PORT).toBe(27017);
		expect(result.data.MONGO_DB).toBe("threshold");
		expect(result.data.KAFKA_CLIENT_ID).toBe("threshold-service");
		expect(result.data.KAFKA_BOOTSTRAP_SERVERS).toBe("kafka:9092");
		expect(result.data.KAFKA_GROUP_ID).toBe("threshold-service-group");
		expect(result.data.KAFKA_TOPIC_FORECASTS).toBe("forecast-events");
		expect(result.data.KAFKA_TOPIC_FORECASTS_DLQ).toBe("forecast-dlq");
		expect(result.data.MONITORING_SERVICE_HOST).toBe("monitoring");
		expect(result.data.MONITORING_SERVICE_PORT).toBe(3000);
		expect(result.data.LOG_LEVEL).toBe("info");
		expect(result.data.NAME).toBe("threshold-service");
	});

	it("coerces string numbers for PORT, MONGODB_PORT and MONITORING_SERVICE_PORT", () => {
		const result = EnvSchema.safeParse({
			PORT: "8080",
			MONGODB_PORT: "27018",
			MONITORING_SERVICE_PORT: "4000",
		});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.PORT).toBe(8080);
		expect(result.data.MONGODB_PORT).toBe(27018);
		expect(result.data.MONITORING_SERVICE_PORT).toBe(4000);
	});

	it("rejects invalid LOG_LEVEL", () => {
		const result = EnvSchema.safeParse({ LOG_LEVEL: "verbose" });
		expect(result.success).toBe(false);
	});

	it("rejects invalid LOG_LEVEL number", () => {
		const result = EnvSchema.safeParse({ LOG_LEVEL: "42" });
		expect(result.success).toBe(false);
	});

	it("accepts all valid LOG_LEVEL values", () => {
		for (const level of ["trace", "debug", "info", "warn", "error", "fatal"]) {
			const result = EnvSchema.safeParse({ LOG_LEVEL: level });
			expect(result.success).toBe(true);
		}
	});

	it("accepts a MONGO_URI override", () => {
		const result = EnvSchema.safeParse({
			MONGO_URI: "mongodb://custom:27017/mydb",
		});
		expect(result.success).toBe(true);
		if (!result.success) return;
		expect(result.data.MONGO_URI).toBe("mongodb://custom:27017/mydb");
	});
});
