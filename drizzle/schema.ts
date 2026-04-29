import {
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── daily_reports ────────────────────────────────────────────────────────────
export const daily_reports = mysqlTable("daily_reports", {
  id: int("id").autoincrement().primaryKey(),
  /** Date of the report in YYYY-MM-DD format */
  date: varchar("date", { length: 10 }).notNull(),
  /** Ibovespa closing value in points */
  ibovespaValue: decimal("ibovespa_value", { precision: 12, scale: 2 }),
  /** Ibovespa daily change in percentage */
  ibovespaChange: decimal("ibovespa_change", { precision: 6, scale: 2 }),
  /** Dollar (USD/BRL) closing value */
  dollarValue: decimal("dollar_value", { precision: 8, scale: 4 }),
  /** Dollar daily change in percentage */
  dollarChange: decimal("dollar_change", { precision: 6, scale: 2 }),
  /** Selic rate in percentage */
  selic: decimal("selic", { precision: 6, scale: 2 }),
  /** Brent oil price in USD */
  brentValue: decimal("brent_value", { precision: 8, scale: 2 }),
  /** Brent daily change in percentage */
  brentChange: decimal("brent_change", { precision: 6, scale: 2 }),
  /** Full market summary text */
  marketSummary: text("market_summary"),
  /** Lessons learned from the day (JSON array or plain text) */
  lessonsLearned: text("lessons_learned"),
  /** Outlook for the next trading day */
  tomorrowOutlook: text("tomorrow_outlook"),
  /** Agent self-evaluation score 0-100 */
  selfScore: int("self_score"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DailyReport = typeof daily_reports.$inferSelect;
export type InsertDailyReport = typeof daily_reports.$inferInsert;

// ─── ticker_notes ─────────────────────────────────────────────────────────────
export const ticker_notes = mysqlTable("ticker_notes", {
  id: int("id").autoincrement().primaryKey(),
  /** Stock ticker symbol e.g. VALE3 */
  ticker: varchar("ticker", { length: 10 }).notNull(),
  /** The note content */
  note: text("note").notNull(),
  /** Optional context or category for the note */
  context: varchar("context", { length: 255 }),
  /** Date the note refers to in YYYY-MM-DD format */
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TickerNote = typeof ticker_notes.$inferSelect;
export type InsertTickerNote = typeof ticker_notes.$inferInsert;

// ─── analyses ─────────────────────────────────────────────────────────────────
export const analyses = mysqlTable("analyses", {
  id: int("id").autoincrement().primaryKey(),
  /** Stock ticker symbol e.g. BBAS3 */
  ticker: varchar("ticker", { length: 10 }).notNull(),
  /** KRYIS score 0-100 */
  score: int("score").notNull(),
  /** Recommendation label */
  recommendation: varchar("recommendation", { length: 50 }).notNull(),
  /** Optional analyst note for this ticker on this date */
  note: text("note"),
  /** Date of the analysis in YYYY-MM-DD format */
  date: varchar("date", { length: 10 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Analysis = typeof analyses.$inferSelect;
export type InsertAnalysis = typeof analyses.$inferInsert;
