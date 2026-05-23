import { StatusCodes } from "http-status-codes";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
	type ComponentTestContext,
	clearDatabase,
	composeAppForComponentTest,
	startMongo,
	stopMongo,
} from "./setup";

const ADMIN = {
	"X-User-Id": "admin-id",
	"X-User-Role": "ADMIN",
	"X-User-Username": "admin",
};

describe("Evaluations Component", () => {
	let ctx: ComponentTestContext;

	beforeAll(startMongo);
	afterAll(stopMongo);

	beforeEach(async () => {
		await clearDatabase();
		ctx = await composeAppForComponentTest();
	});

	async function createThreshold(overrides: {
		name: string;
		utilityType: string;
		value: number;
		thresholdType: string;
		periodType?: string;
		thresholdState?: string;
	}): Promise<string> {
		const res = await request(ctx.app)
			.post("/api/thresholds")
			.set(ADMIN)
			.send(overrides);

		return res.body.id as string;
	}

	describe("Feature: System evaluates realtime readings", () => {
		it("Given ACTUAL threshold and exceeding reading, When realtime evaluated, Then threshold becomes BREACHED", async () => {
			const thresholdId = await createThreshold({
				name: "Elec Limit",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "ACTUAL",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/realtime")
				.set(ADMIN)
				.send({
					readings: {
						electricity: { value: 150 },
					},
					context: {
						thresholdType: "ACTUAL",
					},
				});

			const res = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.thresholdState).toBe("BREACHED");
		});

		it("Given ACTUAL threshold and reading below limit, When realtime evaluated, Then threshold stays ENABLED", async () => {
			const thresholdId = await createThreshold({
				name: "Safe Limit",
				utilityType: "WATER",
				value: 100,
				thresholdType: "ACTUAL",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/realtime")
				.set(ADMIN)
				.send({
					readings: {
						water: { value: 50 },
					},
					context: {
						thresholdType: "ACTUAL",
					},
				});

			const res = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.thresholdState).toBe("ENABLED");
		});

		it("Given DISABLED threshold and exceeding reading, When realtime evaluated, Then threshold stays DISABLED", async () => {
			const thresholdId = await createThreshold({
				name: "Disabled Limit",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "ACTUAL",
			});

			await request(ctx.app)
				.put(`/api/thresholds/${thresholdId}`)
				.set(ADMIN)
				.send({ thresholdState: "DISABLED" });

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/realtime")
				.set(ADMIN)
				.send({
					readings: {
						electricity: { value: 150 },
					},
					context: {
						thresholdType: "ACTUAL",
					},
				});

			const res = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);

			expect(res.body.thresholdState).toBe("DISABLED");
		});

		it("Given multiple utility readings and matching thresholds, When realtime evaluated, Then all matching thresholds become BREACHED", async () => {
			const elecId = await createThreshold({
				name: "Elec Cap",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "ACTUAL",
			});
			const gasId = await createThreshold({
				name: "Gas Cap",
				utilityType: "GAS",
				value: 50,
				thresholdType: "ACTUAL",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/realtime")
				.set(ADMIN)
				.send({
					readings: {
						electricity: { value: 150 },
						gas: { value: 80 },
					},
					context: {
						thresholdType: "ACTUAL",
					},
				});

			const elecRes = await request(ctx.app)
				.get(`/api/thresholds/${elecId}`)
				.set(ADMIN);
			const gasRes = await request(ctx.app)
				.get(`/api/thresholds/${gasId}`)
				.set(ADMIN);

			expect(elecRes.body.thresholdState).toBe("BREACHED");
			expect(gasRes.body.thresholdState).toBe("BREACHED");
		});
	});

	describe("Feature: System evaluates forecast readings", () => {
		it("Given FORECAST threshold and exceeding data point, When forecast evaluated, Then threshold becomes BREACHED", async () => {
			const thresholdId = await createThreshold({
				name: "Forecast Limit",
				utilityType: "ELECTRICITY",
				value: 200,
				thresholdType: "FORECAST",
				periodType: "ONE_DAY",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/forecast")
				.set(ADMIN)
				.send({
					utilityType: "ELECTRICITY",
					dataPoints: [{ date: "2024-01-01", value: 250 }],
				});

			const res = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body.thresholdState).toBe("BREACHED");
		});

		it("Given FORECAST threshold and data point below limit, When forecast evaluated, Then threshold stays ENABLED", async () => {
			const thresholdId = await createThreshold({
				name: "Safe Forecast",
				utilityType: "GAS",
				value: 200,
				thresholdType: "FORECAST",
				periodType: "ONE_WEEK",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/forecast")
				.set(ADMIN)
				.send({
					utilityType: "GAS",
					dataPoints: [{ date: "2024-01-01", value: 150 }],
				});

			const res = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);

			expect(res.body.thresholdState).toBe("ENABLED");
		});

		it("Given FORECAST threshold and data points below limit, When forecast evaluated, Then threshold stays ENABLED", async () => {
			const thresholdId = await createThreshold({
				name: "Monthly Forecast",
				utilityType: "WATER",
				value: 300,
				thresholdType: "FORECAST",
				periodType: "ONE_MONTH",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/forecast")
				.set(ADMIN)
				.send({
					utilityType: "WATER",
					dataPoints: [{ date: "2024-01-01", value: 200 }],
				});

			const res = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);

			expect(res.body.thresholdState).toBe("ENABLED");
		});
	});

	describe("Feature: System resets breached thresholds", () => {
		it("Given a breached ONE_DAY threshold, When reset runs, Then threshold returns to ENABLED", async () => {
			const thresholdId = await createThreshold({
				name: "Daily Reset",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "HISTORICAL",
				periodType: "ONE_DAY",
			});

			await request(ctx.app)
				.post("/api/internal/thresholds/evaluations/realtime")
				.set(ADMIN)
				.send({
					readings: {
						electricity: { value: 150 },
					},
					context: {
						thresholdType: "HISTORICAL",
						periodType: "ONE_DAY",
					},
				});

			const breachedRes = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);
			expect(breachedRes.body.thresholdState).toBe("BREACHED");

			const resetRes = await request(ctx.app)
				.post("/api/internal/thresholds/reset")
				.set(ADMIN);

			expect(resetRes.status).toBe(StatusCodes.OK);
			expect(resetRes.body).toHaveLength(1);
			expect(resetRes.body[0].thresholdState).toBe("ENABLED");

			const finalRes = await request(ctx.app)
				.get(`/api/thresholds/${thresholdId}`)
				.set(ADMIN);
			expect(finalRes.body.thresholdState).toBe("ENABLED");
		});

		it("Given no breached thresholds, When reset runs, Then returns empty array", async () => {
			await createThreshold({
				name: "Enabled Only",
				utilityType: "ELECTRICITY",
				value: 100,
				thresholdType: "ACTUAL",
			});

			const res = await request(ctx.app)
				.post("/api/internal/thresholds/reset")
				.set(ADMIN);

			expect(res.status).toBe(StatusCodes.OK);
			expect(res.body).toEqual([]);
		});

		it("Given non-admin, When reset runs, Then returns 403", async () => {
			const res = await request(ctx.app)
				.post("/api/internal/thresholds/reset")
				.set({
					"X-User-Id": "user-1",
					"X-User-Role": "HOUSEHOLD",
					"X-User-Username": "testuser",
				});

			expect(res.status).toBe(StatusCodes.FORBIDDEN);
		});
	});
});
