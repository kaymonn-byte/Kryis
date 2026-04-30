import {
  boolean,
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

// ─── operations ───────────────────────────────────────────────────────────────
export const operations = mysqlTable("operations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  type: mysqlEnum("type", ["compra", "venda"]).notNull(),
  quantity: int("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  totalValue: decimal("totalValue", { precision: 12, scale: 2 }).notNull(),
  fees: decimal("fees", { precision: 10, scale: 2 }).default("0"),
  operationDate: timestamp("operationDate").notNull(),
  broker: varchar("broker", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Operation = typeof operations.$inferSelect;
export type InsertOperation = typeof operations.$inferInsert;

// ─── watchlist_items (CRUD user watchlist) ────────────────────────────────────
export const watchlist_items = mysqlTable("watchlist_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  targetPrice: decimal("targetPrice", { precision: 10, scale: 2 }),
  stopLoss: decimal("stopLoss", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WatchlistItem = typeof watchlist_items.$inferSelect;
export type InsertWatchlistItem = typeof watchlist_items.$inferInsert;

// ─── trade_reports (recomendações com tracking de resultado) ──────────────────
export const trade_reports = mysqlTable("trade_reports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  ticker: varchar("ticker", { length: 10 }).notNull(),
  thesis: text("thesis").notNull(),
  entryPrice: decimal("entryPrice", { precision: 10, scale: 2 }).notNull(),
  targetPrice: decimal("targetPrice", { precision: 10, scale: 2 }).notNull(),
  stopLoss: decimal("stopLoss", { precision: 10, scale: 2 }).notNull(),
  exitPrice: decimal("exitPrice", { precision: 10, scale: 2 }),
  returnPct: decimal("returnPct", { precision: 8, scale: 4 }),
  result: mysqlEnum("result", ["pendente", "sucesso", "falha"]).default("pendente").notNull(),
  horizon: varchar("horizon", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TradeReport = typeof trade_reports.$inferSelect;
export type InsertTradeReport = typeof trade_reports.$inferInsert;

// ─── chat_messages ────────────────────────────────────────────────────────────
export const chat_messages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ChatMessage = typeof chat_messages.$inferSelect;
export type InsertChatMessage = typeof chat_messages.$inferInsert;

// ─── insights (ideias de trade com aprendizado contínuo) ──────────────────────
// Cada insight é uma ideia de entrada/saída gerada pelo agente ou pelo usuário.
// O campo `assertive` é preenchido após o fechamento para rastrear assertividade.
export const insights = mysqlTable("insights", {
  id: int("id").autoincrement().primaryKey(),
  /** Ticker do ativo (ex: PETR4) ou instrumento (ex: DOLAR, IBOV) */
  ticker: varchar("ticker", { length: 20 }).notNull(),
  /** Direção da operação */
  direction: mysqlEnum("direction", ["compra", "venda", "neutro"]).notNull(),
  /** Preço sugerido de entrada */
  entryPrice: decimal("entryPrice", { precision: 10, scale: 2 }),
  /** Preço alvo de saída */
  targetPrice: decimal("targetPrice", { precision: 10, scale: 2 }),
  /** Stop loss */
  stopLoss: decimal("stopLoss", { precision: 10, scale: 2 }),
  /** Stop gain (alvo de realização parcial) */
  stopGain: decimal("stopGain", { precision: 10, scale: 2 }),
  /** Relação risco/retorno calculada */
  riskReward: decimal("riskReward", { precision: 6, scale: 2 }),
  /** Tese resumida do insight */
  thesis: text("thesis").notNull(),
  /** Horizonte temporal esperado (ex: 1-2 semanas, swing trade) */
  horizon: varchar("horizon", { length: 100 }),
  /** Status atual do insight */
  status: mysqlEnum("status", ["aberta", "fechada", "cancelada"]).default("aberta").notNull(),
  /** Preço real de saída quando fechado */
  exitPrice: decimal("exitPrice", { precision: 10, scale: 2 }),
  /** Retorno percentual real quando fechado */
  returnPct: decimal("returnPct", { precision: 8, scale: 4 }),
  /** Se o insight foi assertivo (preenchido ao fechar) */
  assertive: boolean("assertive"),
  /** Notas adicionais ou contexto de mercado */
  context: text("context"),
  /** Fonte do insight: agente automático ou usuário */
  source: mysqlEnum("source", ["agente", "usuario"]).default("agente").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = typeof insights.$inferInsert;

// ─── morning_analyses (análises de abertura geradas pelo agente) ───────────────
export const morning_analyses = mysqlTable("morning_analyses", {
  id: int("id").autoincrement().primaryKey(),
  /** Date in YYYY-MM-DD format */
  date: varchar("date", { length: 10 }).notNull(),
  /** Market context at opening */
  marketContext: text("market_context"),
  /** Main opportunities identified */
  opportunities: text("opportunities"),
  /** Key risks for the day */
  risks: text("risks"),
  /** Suggested watchlist tickers (JSON array) */
  suggestedTickers: text("suggested_tickers"),
  /** Full analysis text */
  fullAnalysis: text("full_analysis"),
  /** Aggressiveness level: conservador, moderado, agressivo */
  aggressiveness: varchar("aggressiveness", { length: 20 }).default("agressivo"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MorningAnalysis = typeof morning_analyses.$inferSelect;
export type InsertMorningAnalysis = typeof morning_analyses.$inferInsert;
