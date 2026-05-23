-- Goody Labs Portfolio — database schema
-- Paste this entire file into Neon's SQL Editor and click "Run".
-- It is safe to run more than once: it uses IF NOT EXISTS / ALTER.

CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  notes TEXT,
  current_fx_aud_usd DOUBLE PRECISION NOT NULL,
  latest_valuation_usd DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,
  investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  round_order INTEGER NOT NULL,
  round_name TEXT NOT NULL,
  aud_invested DOUBLE PRECISION NOT NULL,
  usd_invested DOUBLE PRECISION NOT NULL,
  fx_aud_usd DOUBLE PRECISION NOT NULL,
  post_money_valuation_usd DOUBLE PRECISION NOT NULL,
  total_raise_usd DOUBLE PRECISION NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rounds_investment_id ON rounds(investment_id);
CREATE INDEX IF NOT EXISTS idx_rounds_order ON rounds(investment_id, round_order);

-- ============================================================
-- If you already created the tables with REAL columns, run these
-- ALTER statements to upgrade in place (safe, preserves data):
-- ============================================================

ALTER TABLE investments
  ALTER COLUMN current_fx_aud_usd TYPE DOUBLE PRECISION,
  ALTER COLUMN latest_valuation_usd TYPE DOUBLE PRECISION;

ALTER TABLE rounds
  ALTER COLUMN aud_invested TYPE DOUBLE PRECISION,
  ALTER COLUMN usd_invested TYPE DOUBLE PRECISION,
  ALTER COLUMN fx_aud_usd TYPE DOUBLE PRECISION,
  ALTER COLUMN post_money_valuation_usd TYPE DOUBLE PRECISION,
  ALTER COLUMN total_raise_usd TYPE DOUBLE PRECISION;
