import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  type Mock,
} from "vitest";
import { ConsumptionSubscriber } from "@interfaces/socket/ConsumptionSubscriber";
import { ConsumptionEvaluationService } from "@application/services/ConsumptionEvaluationService";
import * as SocketFactory from "@interfaces/socket/socketFactory";
import { ThresholdType } from "@domain/value/ThresholdType";
import { PeriodType } from "@domain/value/PeriodType";
import type { Socket } from "socket.io-client";

vi.mock("@interfaces/socket/socketFactory");

type SocketCallback = (...args: unknown[]) => void;

describe("ConsumptionSubscriber", () => {
  let subscriber: ConsumptionSubscriber;
  let mockService: ConsumptionEvaluationService;

  let mockSocket: Partial<Socket> & { on: Mock; emit: Mock };

  let socketCallbacks: Record<string, SocketCallback> = {};

  beforeEach(() => {
    socketCallbacks = {};

    mockSocket = {
      on: vi.fn((event: string, cb: SocketCallback) => {
        socketCallbacks[event] = cb;
        return mockSocket;
      }),
      emit: vi.fn(),
      disconnect: vi.fn(),
      removeAllListeners: vi.fn(),
      connected: true,
    } as unknown as typeof mockSocket;

    vi.mocked(SocketFactory.createSocket).mockResolvedValue(
      mockSocket as unknown as Socket,
    );

    mockService = {
      processReadings: vi.fn().mockResolvedValue(undefined),
    } as unknown as ConsumptionEvaluationService;

    subscriber = new ConsumptionSubscriber("http://mock-url", mockService);
  });

  afterEach(() => vi.clearAllMocks());

  it("should connect to correct namespace and subscribe immediately", async () => {
    await subscriber.connect();

    expect(SocketFactory.createSocket).toHaveBeenCalledWith(
      expect.stringContaining("/utility-meters"),
    );

    if (socketCallbacks["connect"]) socketCallbacks["connect"]();

    expect(mockSocket.emit).toHaveBeenCalledWith("subscribe", [
      { label: "realtime" },
      { label: "day", filter: { from: "1day" } },
      { label: "week", filter: { from: "1week" } },
      { label: "month", filter: { from: "1month" } },
    ]);
  });

  it("should handle 'realtime' batch update and delegate to processReadings", async () => {
    await subscriber.connect();

    const metersData = {
      electricity: { value: 100, utilityConsumptionUnit: "kWh" },
    };

    const payload = [
      {
        label: "realtime",
        utilityMeters: metersData,
      },
    ];

    socketCallbacks["utilityMetersUpdate"](payload);

    expect(mockService.processReadings).toHaveBeenCalledWith(metersData, {
      thresholdType: ThresholdType.ACTUAL,
      periodType: undefined,
    });
  });

  it("should handle 'week' batch update mapping to HISTORICAL/ONE_WEEK", async () => {
    await subscriber.connect();

    const metersData = {
      gas: { value: 50, utilityConsumptionUnit: "m3" },
    };

    const payload = [
      {
        label: "week",
        utilityMeters: metersData,
      },
    ];

    socketCallbacks["utilityMetersUpdate"](payload);

    expect(mockService.processReadings).toHaveBeenCalledWith(metersData, {
      thresholdType: ThresholdType.HISTORICAL,
      periodType: PeriodType.ONE_WEEK,
    });
  });

  it("should handle mixed batch updates correctly", async () => {
    await subscriber.connect();

    const payload = [
      {
        label: "realtime",
        utilityMeters: {
          electricity: { value: 10, utilityConsumptionUnit: "kW" },
        },
      },
      {
        label: "month",
        utilityMeters: {
          water: { value: 20, utilityConsumptionUnit: "L" },
        },
      },
    ];

    socketCallbacks["utilityMetersUpdate"](payload);

    expect(mockService.processReadings).toHaveBeenCalledTimes(2);

    expect(mockService.processReadings).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        electricity: expect.objectContaining({ value: 10 }),
      }),
      { thresholdType: ThresholdType.ACTUAL, periodType: undefined },
    );

    expect(mockService.processReadings).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        water: expect.objectContaining({ value: 20 }),
      }),
      {
        thresholdType: ThresholdType.HISTORICAL,
        periodType: PeriodType.ONE_MONTH,
      },
    );
  });

  it("should handle partial objects applying defaults", async () => {
    await subscriber.connect();

    const payload = [
      {
        label: "realtime",
        utilityMeters: {
          electricity: { value: 100 },
        },
      },
    ];

    socketCallbacks["utilityMetersUpdate"](payload);

    expect(mockService.processReadings).toHaveBeenCalledWith(
      expect.objectContaining({
        electricity: expect.objectContaining({ value: 100 }),
      }),
      expect.anything(),
    );
  });

  it("should handle primitive numbers transforming them to objects", async () => {
    await subscriber.connect();

    const payload = [
      {
        label: "realtime",
        utilityMeters: {
          gas: 55.5,
        },
      },
    ];

    socketCallbacks["utilityMetersUpdate"](payload);

    expect(mockService.processReadings).toHaveBeenCalledWith(
      expect.objectContaining({
        gas: expect.objectContaining({ value: 55.5 }),
      }),
      expect.anything(),
    );
  });

  it("should gracefully ignore invalid payloads", async () => {
    await subscriber.connect();
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(vi.fn());

    const invalidPayload = { label: "realtime", foo: "bar" };

    socketCallbacks["utilityMetersUpdate"](invalidPayload);

    expect(mockService.processReadings).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Invalid batch update"),
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });
});
