import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  getDailyReports,
  getDailyReportByDate,
  getLatestAnalyses,
  getAnalysesByDate,
  getAnalysesByTicker,
  getTickerNotes,
} from "./db";

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

  // ─── Reports ──────────────────────────────────────────────────────────────
  reports: router({
    list: publicProcedure
      .input(z.object({ limit: z.number().min(1).max(100).default(30) }).optional())
      .query(async ({ input }) => {
        return getDailyReports(input?.limit ?? 30);
      }),

    byDate: publicProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        return getDailyReportByDate(input.date);
      }),
  }),

  // ─── Watchlist ────────────────────────────────────────────────────────────
  watchlist: router({
    latest: publicProcedure.query(async () => {
      return getLatestAnalyses();
    }),

    byDate: publicProcedure
      .input(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }))
      .query(async ({ input }) => {
        return getAnalysesByDate(input.date);
      }),

    history: publicProcedure
      .input(z.object({ ticker: z.string().min(1).max(10), limit: z.number().default(30) }))
      .query(async ({ input }) => {
        return getAnalysesByTicker(input.ticker, input.limit);
      }),
  }),

  // ─── Notes ────────────────────────────────────────────────────────────────
  notes: router({
    list: publicProcedure
      .input(
        z
          .object({
            ticker: z.string().min(1).max(10).optional(),
            limit: z.number().min(1).max(200).default(100),
          })
          .optional()
      )
      .query(async ({ input }) => {
        return getTickerNotes(input?.ticker, input?.limit ?? 100);
      }),
  }),
});

export type AppRouter = typeof appRouter;
