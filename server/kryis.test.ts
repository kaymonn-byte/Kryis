/**
 * KRYIS — Unit tests for scheduled routes and tRPC routers.
 *
 * These tests use in-memory mocks so no real database connection is needed.
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Mock the db module ───────────────────────────────────────────────────────

vi.mock("./db", () => ({
  getDailyReports: vi.fn().mockResolvedValue([
    {
      id: 1,
      date: "2026-04-29",
      ibovespaValue: "184750.00",
      ibovespaChange: "-2.05",
      dollarValue: "5.0000",
      dollarChange: "0.51",
      selic: "14.50",
      brentValue: "118.03",
      brentChange: "6.08",
      marketSummary: "Super Quarta: Fed manteve juros, Copom cortou Selic.",
      lessonsLearned: "Incluir PETR4\nIncorporar calendário de earnings",
      tomorrowOutlook: "Monitorar comunicado Copom e petróleo.",
      selfScore: 52,
      createdAt: new Date("2026-04-29T22:00:00Z"),
    },
  ]),
  getDailyReportByDate: vi.fn().mockResolvedValue({
    id: 1,
    date: "2026-04-29",
    marketSummary: "Teste",
    selfScore: 52,
    createdAt: new Date(),
  }),
  getLatestAnalyses: vi.fn().mockResolvedValue([
    { id: 1, ticker: "BBAS3", score: 55, recommendation: "MONITORAR", note: "Setor bancário pressionado.", date: "2026-04-29", createdAt: new Date() },
    { id: 2, ticker: "VALE3", score: 40, recommendation: "AGUARDAR", note: "Resultado abaixo do esperado.", date: "2026-04-29", createdAt: new Date() },
  ]),
  getAnalysesByDate: vi.fn().mockResolvedValue([]),
  getAnalysesByTicker: vi.fn().mockResolvedValue([]),
  getTickerNotes: vi.fn().mockResolvedValue([
    { id: 1, ticker: "VALE3", note: "EBITDA proforma US$3,9bi abaixo do esperado.", context: "Resultado 1T26", date: "2026-04-29", createdAt: new Date() },
    { id: 2, ticker: "BBAS3", note: "Setor bancário penalizado com Copom.", context: "Macro", date: "2026-04-29", createdAt: new Date() },
  ]),
  insertDailyReport: vi.fn().mockResolvedValue({}),
  insertTickerNotes: vi.fn().mockResolvedValue([]),
  insertAnalyses: vi.fn().mockResolvedValue([]),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
}));

// ─── Context factory ──────────────────────────────────────────────────────────

function makeCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("reports.list", () => {
  it("returns list of daily reports", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reports.list({ limit: 10 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("date", "2026-04-29");
    expect(result[0]).toHaveProperty("selfScore", 52);
    expect(result[0]).toHaveProperty("lessonsLearned");
  });
});

describe("reports.byDate", () => {
  it("returns a single report by date", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.reports.byDate({ date: "2026-04-29" });
    expect(result).toBeDefined();
    expect(result?.date).toBe("2026-04-29");
  });
});

describe("watchlist.latest", () => {
  it("returns latest analyses for all tickers", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.watchlist.latest();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    const bbas = result.find((r) => r.ticker === "BBAS3");
    expect(bbas).toBeDefined();
    expect(bbas?.score).toBe(55);
    expect(bbas?.recommendation).toBe("MONITORAR");
  });
});

describe("notes.list", () => {
  it("returns all ticker notes without filter", async () => {
    const caller = appRouter.createCaller(makeCtx());
    const result = await caller.notes.list({ limit: 50 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("ticker", "VALE3");
    expect(result[0]).toHaveProperty("context", "Resultado 1T26");
  });
});

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const ctx = makeCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
