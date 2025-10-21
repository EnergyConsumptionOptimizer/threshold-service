import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { Threshold } from "src/domain/Threshold";
import { ThresholdId } from "src/domain/value/ThresholdId";
import { MongoThresholdRepository } from "src/storage/repositories/MongoThresholdRepository";
import { UtilityType } from "src/domain/value/UtilityType";
import { ThresholdType } from "src/domain/value/ThresholdType";
import { ThresholdValue } from "src/domain/value/ThresholdValue";
import { PeriodType } from "src/domain/value/PeriodType";

describe("MongoThresholdRepository", () => {
  let mongod: MongoMemoryServer;
  let repo: MongoThresholdRepository;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri());
    repo = new MongoThresholdRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
  });

  const makeThreshold = (overrides: Partial<Threshold> = {}): Threshold =>
    ({
      id: ThresholdId.of(overrides.id?.value || crypto.randomUUID()),
      utilityType: overrides.utilityType || UtilityType.GAS,
      thresholdType: overrides.thresholdType || ThresholdType.FORECAST,
      value: overrides.value || ThresholdValue.of(10),
      periodType: overrides.periodType || PeriodType.ONE_DAY,
      isActive: overrides.isActive ?? true,
    }) as Threshold;

  it("saves a threshold", async () => {
    const t = makeThreshold();
    const saved = await repo.save(t);

    expect(saved.utilityType).toBe(t.utilityType);
    expect(saved.periodType).toBe(t.periodType);
    expect(saved.thresholdType).toBe(t.thresholdType);
    expect(saved.value.toPrimitive()).toBe(t.value.toPrimitive());
  });

  it("retrieves a threshold by id", async () => {
    const t = makeThreshold();
    await repo.save(t);

    const found = await repo.findById(t.id);
    expect(found).toBeDefined();
  });

  it("finds by filters", async () => {
    const t1 = makeThreshold({ utilityType: UtilityType.GAS });
    const t2 = makeThreshold({ utilityType: UtilityType.WATER });
    await repo.save(t1);
    await repo.save(t2);

    const results = await repo.findByFilters(UtilityType.GAS);
    expect(results).toHaveLength(1);
  });

  it("updates a threshold", async () => {
    const t = makeThreshold({ value: ThresholdValue.of(10) });
    const saved = await repo.save(t);

    const updated = await repo.update(saved.id, {
      value: ThresholdValue.of(20),
    });
    expect(updated?.value.toPrimitive()).toBe(20);
  });

  it("deletes a threshold", async () => {
    const t = makeThreshold();
    const saved = await repo.save(t);
    await repo.delete(saved.id);

    const found = await repo.findById(saved.id);
    expect(found).toBeNull();
  });

  it("finds by status", async () => {
    const active = makeThreshold({ isActive: true });
    const inactive = makeThreshold({ isActive: false });
    await repo.save(active);
    await repo.save(inactive);

    const results = await repo.findByStatus(true);
    expect(results).toHaveLength(1);
  });
});
