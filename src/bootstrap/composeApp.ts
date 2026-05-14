import { EvaluationServiceImpl } from "@application/services/EvaluationServiceImpl";
import { ThresholdServiceImpl } from "@application/services/ThresholdServiceImpl";
import { createApp } from "@bootstrap/app";
import { config } from "@bootstrap/config";
import { createMainRouter } from "@bootstrap/createMainRouter";
import { ThresholdNameUniquenessPolicy } from "@domain/services/ThresholdNameUniquenessPolicy";
import { MongoOutboxEventPublisher } from "@infrastructure/events/MongoOutboxEventPublisher";
import { MonitoringWebSocketAdapter } from "@infrastructure/MonitoringWebSocketAdapter";
import { KafkaDlqPublisher } from "@infrastructure/messaging/KafkaDlqPublisher";
import { OtelBusinessMetrics } from "@infrastructure/metrics/OtelBusinessMetrics";
import { MongoInboxRepository } from "@infrastructure/persistence/mongo/MongoInboxRepository";
import { MongoThresholdRepository } from "@infrastructure/persistence/mongo/MongoThresholdRepository";
import { MongoUnitOfWork } from "@infrastructure/persistence/mongo/MongoUnitOfWork";
import { UuidIdGenerator } from "@infrastructure/utils/UuidIdGenerator";
import { ForecastMessageHandler } from "@presentation/messaging/ForecastMessageHandler";
import { KafkaForecastConsumer } from "@presentation/messaging/KafkaForecastConsumer";
import { InternalController } from "@presentation/rest/InternalController";
import { ThresholdController } from "@presentation/rest/ThresholdController";
import { ThresholdResetScheduler } from "@presentation/scheduling/ThresholdResetScheduler";
import type { Express } from "express";
import type { Logger } from "pino";

export interface ComposedApp {
	readonly app: Express;
	readonly scheduler: ThresholdResetScheduler;
	readonly forecastConsumer: KafkaForecastConsumer;
	readonly forecastsDlqPublisher: KafkaDlqPublisher;
	readonly monitoringWebSocketAdapter: MonitoringWebSocketAdapter;
}

export async function composeApp(logger: Logger): Promise<ComposedApp> {
	const repository = new MongoThresholdRepository(
		logger.child({ component: "MongoThresholdRepository" }),
	);
	const inboxRepository = new MongoInboxRepository(
		logger.child({ component: "MongoInboxRepository" }),
	);
	const idGenerator = new UuidIdGenerator();
	const metrics = new OtelBusinessMetrics();
	const nameUniqueness = new ThresholdNameUniquenessPolicy(repository);
	const uow = new MongoUnitOfWork(
		logger.child({ component: "MongoUnitOfWork" }),
	);
	const eventPublisher = new MongoOutboxEventPublisher(
		logger.child({ component: "MongoOutboxEventPublisher" }),
	);

	const thresholdService = new ThresholdServiceImpl(
		repository,
		idGenerator,
		metrics,
		nameUniqueness,
		logger.child({ component: "ThresholdServiceImpl" }),
	);
	const evaluationService = new EvaluationServiceImpl(
		repository,
		uow,
		eventPublisher,
		metrics,
		logger.child({ component: "EvaluationServiceImpl" }),
	);

	const controller = new ThresholdController(thresholdService);
	const internalController = new InternalController(
		evaluationService,
		thresholdService,
	);

	const mainRouter = createMainRouter(controller, internalController);
	const app = createApp(mainRouter, logger);

	const scheduler = new ThresholdResetScheduler(
		thresholdService,
		logger.child({ component: "ThresholdResetScheduler" }),
	);

	const forecastsDlqPublisher = new KafkaDlqPublisher(
		config.kafka.brokers,
		config.kafka.clientId,
		config.kafka.topics.forecastsDlq,
		logger.child({ component: "KafkaDlqPublisher" }),
	);

	const forecastMessageHandler = new ForecastMessageHandler(
		evaluationService,
		inboxRepository,
		forecastsDlqPublisher,
		logger.child({ component: "ForecastMessageHandler" }),
	);

	const forecastConsumer = new KafkaForecastConsumer(
		config.kafka.brokers,
		config.kafka.clientId,
		config.kafka.groupId,
		config.kafka.topics.forecasts,
		forecastMessageHandler,
		logger.child({ component: "KafkaForecastConsumer" }),
	);

	const monitoringWebSocketAdapter = new MonitoringWebSocketAdapter(
		config.monitoringServiceUrl,
		evaluationService,
		logger.child({ component: "MonitoringWebSocketAdapter" }),
	);

	return {
		app,
		scheduler,
		forecastConsumer,
		forecastsDlqPublisher,
		monitoringWebSocketAdapter,
	};
}
