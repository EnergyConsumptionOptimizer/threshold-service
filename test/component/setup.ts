import { composeApp } from "@bootstrap/composeApp";
import { pino } from "pino";
import { vi } from "vitest";

vi.mock("@bootstrap/config", () => ({
	config: {
		port: 3000,
		mongo: { uri: "mongodb://placeholder" },
		kafka: {
			clientId: "test-threshold-service",
			brokers: ["localhost:9092"],
			groupId: "test-group",
			topics: {
				forecasts: "test-forecast-events",
				forecastsDlq: "test-forecast-dlq",
			},
		},
		monitoringServiceUrl: "http://localhost:3000",
		logLevel: "silent" as const,
		appName: "test-threshold-service",
	},
}));

export { clearDatabase, startMongo, stopMongo } from "@test/mongoSetup";

export interface ComponentTestContext {
	app: Awaited<ReturnType<typeof composeApp>>["app"];
}

export async function composeAppForComponentTest(): Promise<ComponentTestContext> {
	const { app } = await composeApp(pino({ level: "silent" }));

	return { app };
}
