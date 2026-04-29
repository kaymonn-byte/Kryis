/**
 * Scheduled task endpoints — consumed by the KRYIS automated agent.
 * These routes accept POST requests with a session cookie that has role="user".
 *
 * Endpoints:
 *   POST /api/scheduled/daily-report   — persist full daily market report
 *   POST /api/scheduled/ticker-notes   — persist notes per ticker
 *   POST /api/scheduled/analyze        — persist analysis scores/recommendations
 */

import type { Express, Request, Response } from "express";
import { insertDailyReport, insertTickerNotes, insertAnalyses, getLatestAnalyses } from "./db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function safeDecimal(val: unknown): string | null {
  if (val === undefined || val === null) return null;
  const n = Number(val);
  return isNaN(n) ? null : String(n);
}

function safeInt(val: unknown): number | null {
  if (val === undefined || val === null) return null;
  const n = parseInt(String(val), 10);
  return isNaN(n) ? null : n;
}

// ─── Route Registration ───────────────────────────────────────────────────────

export function registerScheduledRoutes(app: Express) {
  /**
   * POST /api/scheduled/daily-report
   *
   * Body (all fields optional except date):
   * {
   *   date?: string,                  // YYYY-MM-DD, defaults to today
   *   ibovespa?: { value, change },
   *   dollar?:   { value, change },
   *   selic?:    number,
   *   brent?:    { value, change },
   *   marketSummary?:    string,
   *   lessonsLearned?:   string | string[],
   *   tomorrowOutlook?:  string,
   *   selfScore?:        number,
   * }
   */
  app.post("/api/scheduled/daily-report", async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const date: string = body.date ?? todayDate();

      // Normalise lessonsLearned — accept array or string
      let lessonsLearned: string | null = null;
      if (Array.isArray(body.lessonsLearned)) {
        lessonsLearned = body.lessonsLearned.join("\n");
      } else if (typeof body.lessonsLearned === "string") {
        lessonsLearned = body.lessonsLearned;
      }

      const record = {
        date,
        ibovespaValue: safeDecimal(body.ibovespa?.value),
        ibovespaChange: safeDecimal(body.ibovespa?.change),
        dollarValue: safeDecimal(body.dollar?.value),
        dollarChange: safeDecimal(body.dollar?.change),
        selic: safeDecimal(body.selic),
        brentValue: safeDecimal(body.brent?.value),
        brentChange: safeDecimal(body.brent?.change),
        marketSummary: body.marketSummary ?? null,
        lessonsLearned,
        tomorrowOutlook: body.tomorrowOutlook ?? null,
        selfScore: safeInt(body.selfScore),
      };

      await insertDailyReport(record);

      res.json({ success: true, date });
    } catch (err) {
      console.error("[scheduled/daily-report]", err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  /**
   * POST /api/scheduled/ticker-notes
   *
   * Body:
   * {
   *   date?: string,
   *   notes: Array<{ ticker, note, context? }>
   * }
   */
  app.post("/api/scheduled/ticker-notes", async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const date: string = body.date ?? todayDate();
      const rawNotes: unknown[] = Array.isArray(body.notes) ? body.notes : [];

      if (rawNotes.length === 0) {
        res.status(400).json({ success: false, error: "notes array is required and must not be empty" });
        return;
      }

      const records = rawNotes
        .filter((n): n is { ticker: string; note: string; context?: string } => {
          return (
            typeof n === "object" &&
            n !== null &&
            typeof (n as Record<string, unknown>).ticker === "string" &&
            typeof (n as Record<string, unknown>).note === "string"
          );
        })
        .map((n) => ({
          ticker: n.ticker.toUpperCase(),
          note: n.note,
          context: n.context ?? null,
          date,
        }));

      if (records.length === 0) {
        res.status(400).json({ success: false, error: "No valid notes found in request body" });
        return;
      }

      await insertTickerNotes(records);

      res.json({ success: true, saved: records.length, date });
    } catch (err) {
      console.error("[scheduled/ticker-notes]", err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });

  /**
   * POST /api/scheduled/analyze
   *
   * Body:
   * {
   *   date?: string,
   *   tickers?: Array<{ ticker, score, recommendation, note? }>
   * }
   *
   * Returns the latest analyses for all tracked tickers.
   */
  app.post("/api/scheduled/analyze", async (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const date: string = body.date ?? todayDate();
      const rawTickers: unknown[] = Array.isArray(body.tickers) ? body.tickers : [];

      if (rawTickers.length > 0) {
        const records = rawTickers
          .filter((t): t is { ticker: string; score: number; recommendation: string; note?: string } => {
            return (
              typeof t === "object" &&
              t !== null &&
              typeof (t as Record<string, unknown>).ticker === "string" &&
              typeof (t as Record<string, unknown>).score === "number" &&
              typeof (t as Record<string, unknown>).recommendation === "string"
            );
          })
          .map((t) => ({
            ticker: t.ticker.toUpperCase(),
            score: t.score,
            recommendation: t.recommendation,
            note: t.note ?? null,
            date,
          }));

        if (records.length > 0) {
          await insertAnalyses(records);
        }
      }

      // Return latest analyses for all tickers
      const latest = await getLatestAnalyses();
      const results = latest.map((a) => ({
        ticker: a.ticker,
        score: a.score,
        recommendation: a.recommendation,
        note: a.note,
        date: a.date,
      }));

      res.json({ success: true, analyzed: results.length, results });
    } catch (err) {
      console.error("[scheduled/analyze]", err);
      res.status(500).json({ success: false, error: String(err) });
    }
  });
}
