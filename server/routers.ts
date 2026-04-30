import { z } from "zod";
import axios from "axios";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  getDailyReports,
  getDailyReportByDate,
  getLatestAnalyses,
  getAnalysesByDate,
  getAnalysesByTicker,
  getTickerNotes,
  getOperationsByUser,
  createOperation,
  deleteOperation,
  getOperationsByPeriod,
  getWatchlistItemsByUser,
  addWatchlistItem,
  removeWatchlistItem,
  getTradeReportsByUser,
  createTradeReport,
  deleteTradeReport,
  getChatHistory,
  saveChatMessage,
  clearChatHistory,
  createInsight,
  getInsights,
  getInsightById,
  updateInsight,
  getInsightsStats,
  createMorningAnalysis,
  getMorningAnalyses,
  getMorningAnalysisByDate,
} from "./db";

import { callDataApi } from "./_core/dataApi";

// ─── Market Data Helpers ──────────────────────────────────────────────────────

// Lista expandida de ativos monitorados — ações, FIIs, BDRs, ETFs, índices
const ALL_TICKERS = [
  // Blue chips e IBOV
  "PETR4", "VALE3", "ITUB4", "BBDC4", "ABEV3", "WEGE3", "RENT3", "BBAS3",
  "SUZB3", "JBSS3", "GGBR4", "PRIO3", "RADL3", "EGIE3", "LREN3", "CPLE3",
  "HYPE3", "MULT3", "VIVT3", "ITSA4", "NEOE3", "CSAN3", "BPAC11", "RDOR3",
  // Small/mid caps com potencial
  "DIRR3", "MDIA3", "SMFT3", "PETZ3", "RECV3", "RRRP3", "CMIN3", "BRAP4",
  // FIIs
  "MXRF11", "HGLG11", "KNRI11", "XPML11", "VISC11",
  // ETFs
  "BOVA11", "SMAL11", "IVVB11",
  // Índices
  "^BVSP", "USDBRL=X",
];

// Yahoo Finance via Manus Data API
async function fetchYahooQuote(ticker: string) {
  try {
    const suffix = ticker.includes("^") || ticker.includes("=") ? "" : ".SA";
    const symbol = ticker.endsWith(".SA") || ticker.includes("^") || ticker.includes("=") ? ticker : `${ticker}${suffix}`;
    const data = await callDataApi("YahooFinance/get-stock-data", {
      query: { symbol, interval: "1d", range: "3mo" },
    }) as any;
    return data || null;
  } catch { return null; }
}

async function fetchYahooHistory(ticker: string, range = "3mo", interval = "1d") {
  try {
    const suffix = ticker.includes("^") || ticker.includes("=") ? "" : ".SA";
    const symbol = ticker.endsWith(".SA") || ticker.includes("^") || ticker.includes("=") ? ticker : `${ticker}${suffix}`;
    const data = await callDataApi("YahooFinance/get-stock-data", {
      query: { symbol, interval, range },
    }) as any;
    return data || null;
  } catch { return null; }
}

// Fallback para brapi.dev se Yahoo falhar
async function fetchBrapiQuote(ticker: string) {
  try {
    const url = `https://brapi.dev/api/quote/${ticker}?interval=1d&range=3mo&fundamental=true`;
    const res = await axios.get(url, { timeout: 8000 });
    return res.data?.results?.[0] || null;
  } catch { return null; }
}

async function fetchBrapiHistory(ticker: string, range = "3mo", interval = "1d") {
  try {
    const url = `https://brapi.dev/api/quote/${ticker}?interval=${interval}&range=${range}`;
    const res = await axios.get(url, { timeout: 10000 });
    return res.data?.results?.[0] || null;
  } catch { return null; }
}

// Unified quote fetcher: tenta Yahoo primeiro, fallback para brapi
async function fetchQuote(ticker: string) {
  const yahoo = await fetchYahooQuote(ticker);
  if (yahoo && (yahoo.regularMarketPrice || yahoo.price)) return normalizeYahoo(yahoo, ticker);
  return fetchBrapiQuote(ticker);
}

async function fetchHistory(ticker: string, range = "3mo", interval = "1d") {
  const yahoo = await fetchYahooHistory(ticker, range, interval);
  if (yahoo && (yahoo.regularMarketPrice || yahoo.price)) return normalizeYahooHistory(yahoo, ticker);
  return fetchBrapiHistory(ticker, range, interval);
}

function normalizeYahoo(data: any, ticker: string) {
  const meta = data.meta || data;
  const quotes = data.quotes || data.historicalDataPrice || [];
  return {
    symbol: ticker,
    shortName: meta.shortName || meta.longName || ticker,
    regularMarketPrice: meta.regularMarketPrice || meta.price || 0,
    regularMarketChange: meta.regularMarketChange || 0,
    regularMarketChangePercent: meta.regularMarketChangePercent || 0,
    regularMarketVolume: meta.regularMarketVolume || 0,
    marketCap: meta.marketCap || 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow || 0,
    historicalDataPrice: quotes.map((q: any) => ({
      date: q.date || q.timestamp,
      open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume,
    })),
  };
}

function normalizeYahooHistory(data: any, ticker: string) {
  return normalizeYahoo(data, ticker);
}

function calcRSI(closes: number[], period = 14): number {
  if (closes.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses += Math.abs(diff);
  }
  const avgGain = gains / period;
  const avgLoss = losses / period;
  if (avgLoss === 0) return 100;
  return Math.round(100 - (100 / (1 + avgGain / avgLoss)));
}

function calcEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) ema.push(values[i] * k + ema[i - 1] * (1 - k));
  return ema;
}

function calcMACD(closes: number[]) {
  if (closes.length < 26) return { macd: 0, signal: 0, histogram: 0 };
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);
  const macdLine = ema12.map((v, i) => v - ema26[i]);
  const signalLine = calcEMA(macdLine.slice(-9), 9);
  const lastMacd = macdLine[macdLine.length - 1];
  const lastSignal = signalLine[signalLine.length - 1];
  return { macd: parseFloat(lastMacd.toFixed(4)), signal: parseFloat(lastSignal.toFixed(4)), histogram: parseFloat((lastMacd - lastSignal).toFixed(4)) };
}

function calcFibonacci(high: number, low: number) {
  const diff = high - low;
  return {
    level0: parseFloat(high.toFixed(2)),
    level236: parseFloat((high - diff * 0.236).toFixed(2)),
    level382: parseFloat((high - diff * 0.382).toFixed(2)),
    level500: parseFloat((high - diff * 0.5).toFixed(2)),
    level618: parseFloat((high - diff * 0.618).toFixed(2)),
    level786: parseFloat((high - diff * 0.786).toFixed(2)),
    level1000: parseFloat(low.toFixed(2)),
  };
}

function detectPattern(closes: number[], volumes: number[]): string {
  if (closes.length < 5) return "Sem dados suficientes";
  const last = closes[closes.length - 1];
  const prev = closes[closes.length - 2];
  const rsi = calcRSI(closes);
  const macd = calcMACD(closes);
  if (rsi < 30 && macd.histogram > 0) return "Reversão de Alta (RSI Oversold + MACD)";
  if (rsi > 70 && macd.histogram < 0) return "Reversão de Baixa (RSI Overbought + MACD)";
  if (last > prev * 1.02 && volumes[volumes.length - 1] > volumes[volumes.length - 2] * 1.5) return "Breakout com Volume";
  if (last < prev * 0.98 && volumes[volumes.length - 1] > volumes[volumes.length - 2] * 1.5) return "Breakdown com Volume";
  if (rsi < 40 && last > prev) return "Recuperação em Suporte";
  if (rsi > 60 && last < prev) return "Correção em Resistência";
  return "Tendência Neutra";
}

function calcFiscal(ops: any[]) {
  const byMonth: Record<string, { buys: any[]; sells: any[]; pnl: number; tax: number }> = {};
  const positions: Record<string, { qty: number; avgCost: number }> = {};
  for (const op of ops) {
    const date = new Date(op.operationDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    if (!byMonth[monthKey]) byMonth[monthKey] = { buys: [], sells: [], pnl: 0, tax: 0 };
    const ticker = op.ticker;
    if (!positions[ticker]) positions[ticker] = { qty: 0, avgCost: 0 };
    if (op.type === "compra") {
      const totalCost = positions[ticker].qty * positions[ticker].avgCost + parseFloat(op.quantity) * parseFloat(op.price);
      positions[ticker].qty += parseInt(op.quantity);
      positions[ticker].avgCost = positions[ticker].qty > 0 ? totalCost / positions[ticker].qty : 0;
      byMonth[monthKey].buys.push(op);
    } else {
      const avgCost = positions[ticker].avgCost || parseFloat(op.price);
      const pnl = (parseFloat(op.price) - avgCost) * parseInt(op.quantity) - parseFloat(op.fees || "0");
      positions[ticker].qty = Math.max(0, positions[ticker].qty - parseInt(op.quantity));
      byMonth[monthKey].sells.push({ ...op, pnl, avgCost });
      byMonth[monthKey].pnl += pnl;
    }
  }
  for (const month of Object.keys(byMonth)) {
    const m = byMonth[month];
    const totalSellValue = m.sells.reduce((acc, s) => acc + parseFloat(s.totalValue), 0);
    if (m.pnl > 0 && totalSellValue > 20000) m.tax = m.pnl * 0.15;
  }
  return byMonth;
}

// ─── Market Router ────────────────────────────────────────────────────────────

const marketRouter = router({
  getQuote: publicProcedure
    .input(z.object({ ticker: z.string().min(1).max(20) }))
    .query(async ({ input }) => {
      const data = await fetchQuote(input.ticker.toUpperCase());
      if (!data) throw new Error(`Dados não encontrados para ${input.ticker}`);
      return data;
    }),

  getTechnicalAnalysis: publicProcedure
    .input(z.object({ ticker: z.string().min(1).max(20), range: z.string().default("3mo") }))
    .query(async ({ input }) => {
      const ticker = input.ticker.toUpperCase();
      const data = await fetchHistory(ticker, input.range, "1d");
      if (!data) throw new Error(`Dados técnicos não encontrados para ${ticker}`);
      const historicalData = data.historicalDataPrice || [];
      if (historicalData.length === 0) throw new Error(`Sem histórico para ${ticker}`);
      const closes = historicalData.map((d: any) => d.close).filter(Boolean);
      const highs = historicalData.map((d: any) => d.high).filter(Boolean);
      const lows = historicalData.map((d: any) => d.low).filter(Boolean);
      const volumes = historicalData.map((d: any) => d.volume).filter(Boolean);
      const maxHigh = Math.max(...highs);
      const minLow = Math.min(...lows);
      const rsi = calcRSI(closes);
      const macd = calcMACD(closes);
      const fibonacci = calcFibonacci(maxHigh, minLow);
      const ema9 = calcEMA(closes, 9);
      const ema21 = calcEMA(closes, 21);
      const ema50 = calcEMA(closes, 50);
      const pattern = detectPattern(closes, volumes);
      const currentPrice = data.regularMarketPrice || closes[closes.length - 1];
      const trend = ema9[ema9.length - 1] > ema21[ema21.length - 1] ? "Alta" : "Baixa";
      return {
        ticker, currentPrice,
        regularMarketChange: data.regularMarketChange,
        regularMarketChangePercent: data.regularMarketChangePercent,
        regularMarketVolume: data.regularMarketVolume,
        marketCap: data.marketCap,
        fiftyTwoWeekHigh: data.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: data.fiftyTwoWeekLow,
        candlestick: historicalData.map((d: any) => ({ time: d.date, open: d.open, high: d.high, low: d.low, close: d.close, volume: d.volume })),
        indicators: {
          rsi, macd,
          ema9: parseFloat(ema9[ema9.length - 1].toFixed(2)),
          ema21: parseFloat(ema21[ema21.length - 1].toFixed(2)),
          ema50: closes.length >= 50 ? parseFloat(ema50[ema50.length - 1].toFixed(2)) : null,
          fibonacci, trend, pattern,
        },
        signal: rsi < 35 ? "COMPRA" : rsi > 65 ? "VENDA" : "NEUTRO",
        signalStrength: rsi < 30 || rsi > 70 ? "FORTE" : "MODERADO",
      };
    }),

  // Cotações em tempo real para o Dashboard — atualiza a cada chamada
  getDashboardQuotes: publicProcedure.query(async () => {
    const tickers = ["PETR4", "VALE3", "ITUB4", "BBDC4", "WEGE3", "BBAS3", "PRIO3", "EGIE3", "CPLE3", "HYPE3"];
    const results = await Promise.allSettled(tickers.map(t => fetchQuote(t)));
    return results
      .filter(r => r.status === "fulfilled" && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);
  }),

  // Overview do mercado: Ibovespa, Dólar, Brent
  getMarketOverview: publicProcedure.query(async () => {
    const [ibov, dolar] = await Promise.allSettled([
      fetchQuote("^BVSP"),
      fetchQuote("USDBRL=X"),
    ]);
    return {
      ibovespa: ibov.status === "fulfilled" ? ibov.value : null,
      dolar: dolar.status === "fulfilled" ? dolar.value : null,
      timestamp: new Date().toISOString(),
    };
  }),

  // Busca todos os ativos monitorados
  getAllTickers: publicProcedure.query(() => ALL_TICKERS),

  // Análises de abertura
  morningAnalyses: publicProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => getMorningAnalyses(input?.limit ?? 10)),

  morningAnalysisByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input }) => getMorningAnalysisByDate(input.date)),
});

// ─── Scanner Router ───────────────────────────────────────────────────────────

const scannerRouter = router({
  scan: publicProcedure
    .input(z.object({
      filter: z.enum(["all", "buy", "sell", "oversold", "overbought"]).default("all"),
      limit: z.number().default(30),
    }))
    .query(async ({ input }) => {
      // Usa lista expandida de ações (sem índices e ETFs para análise técnica)
      const tickers = ALL_TICKERS.filter(t => !t.includes("^") && !t.includes("=") && !t.endsWith("11") || ["MXRF11", "HGLG11", "KNRI11", "BOVA11", "SMAL11"].includes(t));
      const results: any[] = [];
      await Promise.allSettled(
        tickers.map(async (ticker) => {
          try {
            const data = await fetchHistory(ticker, "3mo", "1d");
            if (!data) return;
            const historicalData = data.historicalDataPrice || [];
            if (historicalData.length < 15) return;
            const closes = historicalData.map((d: any) => d.close).filter(Boolean);
            const volumes = historicalData.map((d: any) => d.volume).filter(Boolean);
            const highs = historicalData.map((d: any) => d.high).filter(Boolean);
            const lows = historicalData.map((d: any) => d.low).filter(Boolean);
            const rsi = calcRSI(closes);
            const macd = calcMACD(closes);
            const ema9 = calcEMA(closes, 9);
            const ema21 = calcEMA(closes, 21);
            const trend = ema9[ema9.length - 1] > ema21[ema21.length - 1] ? "Alta" : "Baixa";
            const pattern = detectPattern(closes, volumes);
            const signal = rsi < 35 ? "COMPRA" : rsi > 65 ? "VENDA" : "NEUTRO";
            // Score agressivo: prioriza sinais fortes de compra e venda
            const rsiScore = rsi < 30 ? 40 : rsi < 40 ? 25 : rsi > 70 ? 40 : rsi > 60 ? 25 : 10;
            const macdScore = Math.abs(macd.histogram) > 0.5 ? 25 : macd.histogram !== 0 ? 15 : 5;
            const trendScore = trend === "Alta" ? 20 : 10;
            const changeScore = Math.abs(data.regularMarketChangePercent || 0) > 3 ? 15 : 5;
            const score = Math.round(rsiScore + macdScore + trendScore + changeScore);
            // Stop loss e stop gain sugeridos
            const currentPrice = data.regularMarketPrice || closes[closes.length - 1];
            const maxHigh = Math.max(...highs.slice(-20));
            const minLow = Math.min(...lows.slice(-20));
            const stopLoss = signal === "COMPRA" ? parseFloat((currentPrice * 0.95).toFixed(2)) : parseFloat((currentPrice * 1.05).toFixed(2));
            const stopGain = signal === "COMPRA" ? parseFloat((currentPrice * 1.10).toFixed(2)) : parseFloat((currentPrice * 0.90).toFixed(2));
            results.push({ ticker, price: currentPrice, change: data.regularMarketChangePercent, rsi, macd: macd.histogram, trend, pattern, signal, score, stopLoss, stopGain, high52w: maxHigh, low52w: minLow });
          } catch { /* skip */ }
        })
      );
      let filtered = results;
      if (input.filter === "buy") filtered = results.filter(r => r.signal === "COMPRA");
      else if (input.filter === "sell") filtered = results.filter(r => r.signal === "VENDA");
      else if (input.filter === "oversold") filtered = results.filter(r => r.rsi < 35);
      else if (input.filter === "overbought") filtered = results.filter(r => r.rsi > 65);
      return filtered.sort((a, b) => b.score - a.score).slice(0, input.limit);
    }),
});

// ─── Operations Router ────────────────────────────────────────────────────────

const operationsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getOperationsByUser(ctx.user.id)),

  create: protectedProcedure
    .input(z.object({
      ticker: z.string().min(1).max(10),
      type: z.enum(["compra", "venda"]),
      quantity: z.number().positive(),
      price: z.number().positive(),
      fees: z.number().min(0).default(0),
      operationDate: z.string(),
      broker: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const totalValue = input.quantity * input.price;
      await createOperation({
        userId: ctx.user.id,
        ticker: input.ticker.toUpperCase(),
        type: input.type,
        quantity: input.quantity,
        price: input.price.toFixed(2) as any,
        totalValue: totalValue.toFixed(2) as any,
        fees: input.fees.toFixed(2) as any,
        operationDate: new Date(input.operationDate),
        broker: input.broker,
        notes: input.notes,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteOperation(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Fiscal Router ────────────────────────────────────────────────────────────

const fiscalRouter = router({
  getSummary: protectedProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const year = input.year || new Date().getFullYear();
      const ops = await getOperationsByPeriod(ctx.user.id, new Date(year, 0, 1), new Date(year, 11, 31, 23, 59, 59));
      if (ops.length === 0) return { year, months: {}, totalPnl: 0, totalTax: 0, totalBuyValue: 0, totalSellValue: 0, operations: [] };
      const byMonth = calcFiscal(ops);
      const totalPnl = Object.values(byMonth).reduce((acc, m) => acc + m.pnl, 0);
      const totalTax = Object.values(byMonth).reduce((acc, m) => acc + m.tax, 0);
      const totalBuyValue = ops.filter(o => o.type === "compra").reduce((acc, o) => acc + parseFloat(String(o.totalValue)), 0);
      const totalSellValue = ops.filter(o => o.type === "venda").reduce((acc, o) => acc + parseFloat(String(o.totalValue)), 0);
      return { year, months: byMonth, totalPnl: parseFloat(totalPnl.toFixed(2)), totalTax: parseFloat(totalTax.toFixed(2)), totalBuyValue: parseFloat(totalBuyValue.toFixed(2)), totalSellValue: parseFloat(totalSellValue.toFixed(2)), operations: ops };
    }),
});

// ─── Watchlist CRUD Router ────────────────────────────────────────────────────

const watchlistCrudRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getWatchlistItemsByUser(ctx.user.id)),

  add: protectedProcedure
    .input(z.object({ ticker: z.string().min(1).max(10), targetPrice: z.number().optional(), stopLoss: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await addWatchlistItem({ userId: ctx.user.id, ticker: input.ticker.toUpperCase(), targetPrice: input.targetPrice?.toFixed(2) as any, stopLoss: input.stopLoss?.toFixed(2) as any, notes: input.notes });
      return { success: true };
    }),

  remove: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await removeWatchlistItem(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Trade Reports Router ─────────────────────────────────────────────────────

const tradeReportsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => getTradeReportsByUser(ctx.user.id)),

  create: protectedProcedure
    .input(z.object({
      ticker: z.string().min(1).max(10),
      thesis: z.string().min(1),
      entryPrice: z.number().positive(),
      targetPrice: z.number().positive(),
      stopLoss: z.number().positive(),
      horizon: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await createTradeReport({
        userId: ctx.user.id,
        ticker: input.ticker.toUpperCase(),
        thesis: input.thesis,
        entryPrice: input.entryPrice.toFixed(2) as any,
        targetPrice: input.targetPrice.toFixed(2) as any,
        stopLoss: input.stopLoss.toFixed(2) as any,
        horizon: input.horizon,
        notes: input.notes,
      });
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await deleteTradeReport(input.id, ctx.user.id);
      return { success: true };
    }),
});

// ─── Chat Router ──────────────────────────────────────────────────────────────

const chatRouter = router({
  getHistory: protectedProcedure.query(async ({ ctx }) => {
    const msgs = await getChatHistory(ctx.user.id, 100);
    return msgs.reverse();
  }),

  sendMessage: protectedProcedure
    .input(z.object({ content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      await saveChatMessage({ userId: ctx.user.id, role: "user", content: input.content });
      const history = await getChatHistory(ctx.user.id, 10);
      const messages = history.reverse().map(m => ({ role: m.role as "user" | "assistant", content: m.content }));
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `Você é KRYIS, um analista especializado no mercado de ações brasileiro (B3) e outros instrumentos financeiros.
Seu perfil é de um profissional excepcional, focado em identificar oportunidades negligenciadas — ativos descontados com alto potencial de valorização.
Seja direto, pragmático e use linguagem simples. Sempre que recomendar uma operação, informe:
- Ticker/instrumento e nome
- Direção: COMPRA ou VENDA
- Tese de investimento resumida
- Ponto de entrada sugerido
- Ponto de saída (alvo)
- Stop loss
- Relação risco/retorno estimada
- Horizonte temporal
Priorize ganhos consistentes, não ganância extrema. Evite riscos desnecessários após grandes valorizações.
Lembre-se da filosofia: capturar movimentos fortes sem depender de timing perfeito.`
          },
          ...messages,
          { role: "user", content: input.content }
        ]
      });
      const rawContent = response.choices?.[0]?.message?.content;
      const assistantContent = typeof rawContent === "string" ? rawContent : "Desculpe, não consegui processar sua mensagem.";
      await saveChatMessage({ userId: ctx.user.id, role: "assistant", content: assistantContent });
      return { content: assistantContent };
    }),

  clear: protectedProcedure.mutation(async ({ ctx }) => {
    await clearChatHistory(ctx.user.id);
    return { success: true };
  }),
});

// ─── Insights Router ──────────────────────────────────────────────────────────

const insightsRouter = router({
  list: publicProcedure
    .input(z.object({ status: z.enum(["aberta", "fechada", "cancelada"]).optional(), limit: z.number().default(100) }).optional())
    .query(async ({ input }) => getInsights(input?.status, input?.limit ?? 100)),

  stats: publicProcedure.query(async () => getInsightsStats()),

  byId: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => getInsightById(input.id)),

  create: protectedProcedure
    .input(z.object({
      ticker: z.string().min(1).max(20),
      direction: z.enum(["compra", "venda", "neutro"]),
      entryPrice: z.number().optional(),
      targetPrice: z.number().optional(),
      stopLoss: z.number().optional(),
      thesis: z.string().min(1),
      horizon: z.string().optional(),
      context: z.string().optional(),
      source: z.enum(["agente", "usuario"]).default("usuario"),
    }))
    .mutation(async ({ input }) => {
      const riskReward = input.entryPrice && input.targetPrice && input.stopLoss
        ? parseFloat(((input.targetPrice - input.entryPrice) / (input.entryPrice - input.stopLoss)).toFixed(2))
        : undefined;
      await createInsight({
        ticker: input.ticker.toUpperCase(),
        direction: input.direction,
        entryPrice: input.entryPrice?.toFixed(2) as any,
        targetPrice: input.targetPrice?.toFixed(2) as any,
        stopLoss: input.stopLoss?.toFixed(2) as any,
        riskReward: riskReward?.toFixed(2) as any,
        thesis: input.thesis,
        horizon: input.horizon,
        context: input.context,
        source: input.source,
      });
      return { success: true };
    }),

  close: protectedProcedure
    .input(z.object({
      id: z.number(),
      exitPrice: z.number().positive(),
      assertive: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const insight = await getInsightById(input.id);
      if (!insight) throw new Error("Insight não encontrado");
      const entryPrice = parseFloat(String(insight.entryPrice || 0));
      const returnPct = entryPrice > 0
        ? parseFloat(((input.exitPrice - entryPrice) / entryPrice * 100 * (insight.direction === "venda" ? -1 : 1)).toFixed(4))
        : 0;
      await updateInsight(input.id, {
        status: "fechada",
        exitPrice: input.exitPrice.toFixed(2) as any,
        returnPct: returnPct.toFixed(4) as any,
        assertive: input.assertive,
        context: input.notes ? `${insight.context || ""}\n\nFechamento: ${input.notes}`.trim() : insight.context ?? undefined,
      });
      return { success: true };
    }),

  cancel: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await updateInsight(input.id, { status: "cancelada" });
      return { success: true };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Agent-facing daily reports
  reports: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
      .query(async ({ input }) => getDailyReports(input?.limit ?? 30)),
    byDate: publicProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => getDailyReportByDate(input.date)),
  }),

  // Agent-facing analyses watchlist
  watchlist: router({
    latest: publicProcedure.query(async () => getLatestAnalyses()),
    byDate: publicProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => getAnalysesByDate(input.date)),
    history: publicProcedure
      .input(z.object({ ticker: z.string().min(1).max(10), limit: z.number().default(30) }))
      .query(async ({ input }) => getAnalysesByTicker(input.ticker, input.limit)),
  }),

  // Agent-facing ticker notes
  notes: router({
    list: publicProcedure
      .input(z.object({ ticker: z.string().min(1).max(10).optional(), limit: z.number().min(1).max(200).default(100) }).optional())
      .query(async ({ input }) => getTickerNotes(input?.ticker, input?.limit ?? 100)),
  }),

  // User-facing features
  market: marketRouter,
  scanner: scannerRouter,
  operations: operationsRouter,
  fiscal: fiscalRouter,
  watchlistCrud: watchlistCrudRouter,
  tradeReports: tradeReportsRouter,
  chat: chatRouter,
  insights: insightsRouter,
});

export type AppRouter = typeof appRouter;
