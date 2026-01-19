import { MongoThresholdRepository } from "@storage/repositories/MongoThresholdRepository";
import { ThresholdController } from "@interfaces/web-api/controllers/ThresholdController";
import { AuthMiddleware } from "@interfaces/web-api/middlewares/AuthMiddleware";
import { router } from "@interfaces/web-api/routes/router";
import { ResetThresholdUseCase } from "@application/usecases/ResetThresholdUseCase";
import { ThresholdResetScheduler } from "@interfaces/ThresholdResetScheduler";
import { ThresholdMonitoringService } from "@application/services/ThresholdMonitoringService";
import { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";
import { HttpAlertServiceAdapter } from "@interfaces/HttpAlertServiceAdapter";
import type { ThresholdBreachNotificationPort } from "@domain/port/ThresholdBreachNotificationPort";
import { UuidThresholdIdGeneratorAdapter } from "@interfaces/UuidThresholdIdGeneratorAdapter";
import { CreateThresholdUseCase } from "@application/usecases/CreateThresholdUseCase";
import { ListThresholdsUseCase } from "@application/usecases/ListThresholdsUseCase";
import { GetThresholdByIdUseCase } from "@application/usecases/GetThresholdByIdUseCase";
import { UpdateThresholdUseCase } from "@application/usecases/UpdateThresholdUseCase";
import { DeleteThresholdUseCase } from "@application/usecases/DeleteThresholdUseCase";
import { EvaluateForecastUseCase } from "@application/usecases/EvaluateForecastUseCase";
import { ConsumptionSubscriber } from "@interfaces/socket/ConsumptionSubscriber";
import { ThresholdSocketPublisher } from "@interfaces/socket/ThresholdSocketPublisher";

export interface WebApiConfig {
  alertServiceUrl: string;
  monitoringServiceUrl: string;
  monitoringIntervalMs: number;
  userServiceUrl: string;
}

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
  const resetUseCase = new ResetThresholdUseCase(repository);

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

  const thresholdResetScheduler = new ThresholdResetScheduler(resetUseCase);
  const socketPublisher = new ThresholdSocketPublisher(
    config.monitoringServiceUrl,
  );

  const thresholdMonitoringService = new ThresholdMonitoringService(
    repository,
    socketPublisher,
    config.monitoringIntervalMs,
  );

  const createConsumptionEventListener = () =>
    new ConsumptionSubscriber(config.monitoringServiceUrl, evaluationService);

  return {
    apiRouter,
    thresholdResetScheduler,
    thresholdMonitoringService,
    createConsumptionEventListener,
  } as const;
}
