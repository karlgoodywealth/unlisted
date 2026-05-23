import { pgTable, serial, text, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  notes: text("notes"),
  currentFxAudUsd: doublePrecision("current_fx_aud_usd").notNull(),
  latestValuationUsd: doublePrecision("latest_valuation_usd").notNull(),
});

export const rounds = pgTable("rounds", {
  id: serial("id").primaryKey(),
  investmentId: integer("investment_id")
    .notNull()
    .references(() => investments.id, { onDelete: "cascade" }),
  roundOrder: integer("round_order").notNull(),
  roundName: text("round_name").notNull(),
  audInvested: doublePrecision("aud_invested").notNull(),
  usdInvested: doublePrecision("usd_invested").notNull(),
  fxAudUsd: doublePrecision("fx_aud_usd").notNull(),
  postMoneyValuationUsd: doublePrecision("post_money_valuation_usd").notNull(),
  totalRaiseUsd: doublePrecision("total_raise_usd").notNull(),
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({ id: true });
export const insertRoundSchema = createInsertSchema(rounds).omit({ id: true, usdInvested: true });

export const updateInvestmentSchema = insertInvestmentSchema.partial();
export const updateRoundSchema = insertRoundSchema.partial();

export type InsertInvestment = z.infer<typeof insertInvestmentSchema>;
export type Investment = typeof investments.$inferSelect;
export type InsertRound = z.infer<typeof insertRoundSchema>;
export type Round = typeof rounds.$inferSelect;

export type InvestmentWithRounds = Investment & { rounds: Round[] };
