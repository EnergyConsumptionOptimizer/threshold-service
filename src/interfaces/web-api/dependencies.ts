import { MongoThresholdRepository } from "@storage/repositories/MongoThresholdRepository";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { router } from "@interfaces/web-api/routes/router";
import { ResetThresholdUseCase } from "@application/usecases/ResetThresholdUseCase";
import { ThresholdResetScheduler } from "@interfaces/ThresholdResetScheduler";
import { ThresholdMonitoringService } from "@application/services/ThresholdMonitoringService";
import { SocketIOThresholdNotificationAdapter } from "@interfaces/SocketIOThresholdNotificationAdapter";
import { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";
import { ConsumptionEventListener } from "@interfaces/ConsumptionEventListener";
import { HttpAlertServiceAdapter } from "@interfaces/HttpAlertServiceAdapter";
import type { ThresholdBreachNotificationPort } from "@domain/port/ThresholdBreachNotificationPort";
import { UuidThresholdIdGeneratorAdapter } from "@interfaces/UuidThresholdIdGeneratorAdapter";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { ListThresholdsUseCase } from "@application/usecases/ListThresholdsUseCase";
import { GetThresholdByIdUseCase } from "@application/usecases/GetThresholdByIdUseCase";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { EvaluateForecastUseCase } from "@application/usecases/EvaluateForecastUseCase";

export interface WebApiConfig {
  /** Base URL of the alert service used to emit breach notifications. */
  alertServiceUrl: string;
  /** Base URL of the monitoring service used for socket connections. */
  monitoringServiceUrl: string;
  /** Polling interval (ms) for publishing threshold updates. */
  monitoringIntervalMs: number;
  /** Base URL of the user service used for authentication checks. */
  userServiceUrl: string;
}

/**
 * Build the Web API adapters, application services, and router.
 *
 * @param config Runtime configuration for external service URLs and intervals.
 * @returns The router and background services to run alongside the HTTP server.
 */
export function createWebApiDependencies(config: WebApiConfig) {
  const repository = new MongoThresholdRepository();
  const idGenerator = new UuidThresholdIdGeneratorAdapter();

  const alertService = new HttpAlertServiceAdapter(config.alertServiceUrl);

  const breachNotificationPort: ThresholdBreachNotificationPort = {
    async notifyThresholdsBreach(consumption, breachedThresholds) {
      for (const threshold of breachedThresholds) {
        await alertService.notifyBreach(threshold, consumption.value);
      }
    },
  };

  const evaluationService = new ConsumptionEvaluationService(
    repository,
    breachNotificationPort,
  );

  const createThresholdUseCase = new CreateThresholdUseCase(
    repository,
    idGenerator,
  );
  const listThresholdsUseCase = new ListThresholdsUseCase(repository);
  const getThresholdByIdUseCase = new GetThresholdByIdUseCase(repository);
  const updateThresholdUseCase = new UpdateThresholdUseCase(repository);
  const deleteThresholdUseCase = new DeleteThresholdUseCase(repository);
  const evaluateForecastUseCase = new EvaluateForecastUseCase(
    evaluationService,
  );

  const thresholdController = new ThresholdController(
    createThresholdUseCase,
    listThresholdsUseCase,
    getThresholdByIdUseCase,
    updateThresholdUseCase,
    deleteThresholdUseCase,
    evaluateForecastUseCase,
  );

  const authMiddleware = new AuthMiddleware(config.userServiceUrl);
  const apiRouter = router(thresholdController, authMiddleware);

  const resetUseCase = new ResetThresholdUseCase(repository);
  const thresholdResetScheduler = new ThresholdResetScheduler(resetUseCase);

  const socketAdapter = new SocketIOThresholdNotificationAdapter(
    config.monitoringServiceUrl,
  );
  const thresholdMonitoringService = new ThresholdMonitoringService(
    repository,
    socketAdapter,
    config.monitoringIntervalMs,
  );

  const createConsumptionEventListener = () =>
    new ConsumptionEventListener(
      config.monitoringServiceUrl,
      evaluationService,
    );

  return {
    apiRouter,
    thresholdResetScheduler,
    thresholdMonitoringService,
    createConsumptionEventListener,
  } as const;
}
