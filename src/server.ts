import "dotenv/config";

import { composeApp } from "@bootstrap/composeApp";
import { config } from "@bootstrap/config";
import { connectMongo } from "@bootstrap/mongoConnection";
import { retryForever } from "@bootstrap/retryForever";
import { setupGracefulShutdown } from "@bootstrap/shutdown";
import { startInstrumentation } from "@root/instrumentation.js";
import { createLogger } from "@root/logger.js";

const rootLogger = createLogger(config);
const logger = rootLogger.child({ component: "Server" });
const sdk = startInstrumentation(rootLogger);

async function start(): Promise<void> {
	await connectMongo(config.mongo.uri, logger);

	const composed = await composeApp(rootLogger);

	const server = composed.app.listen(config.port, () => {
		logger.info({ port: config.port }, "listening");
	});

	composed.scheduler.start();
	composed.monitoringWebSocketAdapter.connect();

	void retryForever(
		"Kafka consumer",
		async () => {
			await composed.forecastConsumer.connect();
			await composed.forecastConsumer.start();
		},
		logger,
	);

	void retryForever(
		"Kafka DLQ publisher",
		async () => {
			await composed.forecastsDlqPublisher.connect();
		},
		logger,
	);

	setupGracefulShutdown(server, composed, sdk, logger);
}

void start();
