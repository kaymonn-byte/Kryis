import { desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  analyses,
  daily_reports,
  ticker_notes,
  users,
  type InsertAnalysis,
  type InsertDailyReport,
  type InsertTickerNote,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;

  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }

  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Daily Reports ────────────────────────────────────────────────────────────

export async function insertDailyReport(data: InsertDailyReport) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(daily_reports).values(data);
  return result;
}

export async function getDailyReports(limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(daily_reports).orderBy(desc(daily_reports.createdAt)).limit(limit);
}

export async function getDailyReportByDate(date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(daily_reports).where(eq(daily_reports.date, date)).limit(1);
  return result[0];
}

// ─── Ticker Notes ─────────────────────────────────────────────────────────────

export async function insertTickerNote(data: InsertTickerNote) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(ticker_notes).values(data);
  return result;
}

export async function insertTickerNotes(data: InsertTickerNote[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return [];
  return db.insert(ticker_notes).values(data);
}

export async function getTickerNotes(ticker?: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  const query = db.select().from(ticker_notes).orderBy(desc(ticker_notes.createdAt)).limit(limit);
  if (ticker) {
    return db
      .select()
      .from(ticker_notes)
      .where(eq(ticker_notes.ticker, ticker.toUpperCase()))
      .orderBy(desc(ticker_notes.createdAt))
      .limit(limit);
  }
  return query;
}

// ─── Analyses ─────────────────────────────────────────────────────────────────

export async function insertAnalyses(data: InsertAnalysis[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  if (data.length === 0) return [];
  return db.insert(analyses).values(data);
}

export async function getLatestAnalyses() {
  const db = await getDb();
  if (!db) return [];
  // Get all analyses ordered by date desc, then deduplicate by ticker in JS
  const rows = await db
    .select()
    .from(analyses)
    .orderBy(desc(analyses.date), desc(analyses.createdAt))
    .limit(500);

  const seen = new Set<string>();
  const latest: typeof rows = [];
  for (const row of rows) {
    if (!seen.has(row.ticker)) {
      seen.add(row.ticker);
      latest.push(row);
    }
  }
  return latest;
}

export async function getAnalysesByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(analyses).where(eq(analyses.date, date)).orderBy(desc(analyses.createdAt));
}

export async function getAnalysesByTicker(ticker: string, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(analyses)
    .where(eq(analyses.ticker, ticker.toUpperCase()))
    .orderBy(desc(analyses.date))
    .limit(limit);
}

// ─── Operations ───────────────────────────────────────────────────────────────

import { and, gte, lte } from "drizzle-orm";
import {
  InsertOperation,
  InsertWatchlistItem,
  InsertTradeReport,
  InsertChatMessage,
  InsertInsight,
  operations,
  watchlist_items,
  trade_reports,
  chat_messages,
  insights,
} from "../drizzle/schema";

export async function getOperationsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operations).where(eq(operations.userId, userId)).orderBy(desc(operations.operationDate));
}

export async function createOperation(op: InsertOperation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(operations).values(op);
}

export async function deleteOperation(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(operations).where(and(eq(operations.id, id), eq(operations.userId, userId)));
}

export async function getOperationsByPeriod(userId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(operations)
    .where(and(eq(operations.userId, userId), gte(operations.operationDate, startDate), lte(operations.operationDate, endDate)))
    .orderBy(desc(operations.operationDate));
}

// ─── Watchlist Items ──────────────────────────────────────────────────────────

export async function getWatchlistItemsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(watchlist_items).where(eq(watchlist_items.userId, userId)).orderBy(desc(watchlist_items.createdAt));
}

export async function addWatchlistItem(item: InsertWatchlistItem) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(watchlist_items).values(item);
}

export async function removeWatchlistItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(watchlist_items).where(and(eq(watchlist_items.id, id), eq(watchlist_items.userId, userId)));
}

// ─── Trade Reports ────────────────────────────────────────────────────────────

export async function getTradeReportsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(trade_reports).where(eq(trade_reports.userId, userId)).orderBy(desc(trade_reports.createdAt));
}

export async function createTradeReport(report: InsertTradeReport) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(trade_reports).values(report);
}

export async function deleteTradeReport(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(trade_reports).where(and(eq(trade_reports.id, id), eq(trade_reports.userId, userId)));
}

// ─── Chat Messages ────────────────────────────────────────────────────────────

export async function getChatHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chat_messages).where(eq(chat_messages.userId, userId)).orderBy(desc(chat_messages.createdAt)).limit(limit);
}

export async function saveChatMessage(msg: InsertChatMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(chat_messages).values(msg);
}

export async function clearChatHistory(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.delete(chat_messages).where(eq(chat_messages.userId, userId));
}

// ─── Insights ─────────────────────────────────────────────────────────────────

export async function createInsight(data: InsertInsight) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(insights).values(data);
  return result;
}

export async function getInsights(status?: "aberta" | "fechada" | "cancelada", limit = 100) {
  const db = await getDb();
  if (!db) return [];
  if (status) {
    return db.select().from(insights).where(eq(insights.status, status)).orderBy(desc(insights.createdAt)).limit(limit);
  }
  return db.select().from(insights).orderBy(desc(insights.createdAt)).limit(limit);
}

export async function getInsightById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(insights).where(eq(insights.id, id)).limit(1);
  return result[0];
}

export async function updateInsight(id: number, data: Partial<InsertInsight>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.update(insights).set({ ...data, updatedAt: new Date() } as any).where(eq(insights.id, id));
}

export async function getInsightsStats() {
  const db = await getDb();
  if (!db) return { total: 0, open: 0, closed: 0, assertive: 0, assertiveRate: 0 };
  const all = await db.select().from(insights).orderBy(desc(insights.createdAt)).limit(1000);
  const closed = all.filter(i => i.status === "fechada");
  const assertiveCount = closed.filter(i => i.assertive === true).length;
  return {
    total: all.length,
    open: all.filter(i => i.status === "aberta").length,
    closed: closed.length,
    assertive: assertiveCount,
    assertiveRate: closed.length > 0 ? Math.round((assertiveCount / closed.length) * 100) : 0,
  };
}
