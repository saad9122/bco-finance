-- Migration: Dashboard Financial Records Redesign
-- Run manually: psql $DATABASE_URL -f scripts/migrate-financial-schema.sql
--
-- WARNING: This drops existing monthly_records data and alters members.
-- Back up your database before running.

BEGIN;

-- --- members: remove userId, add opening balances ---
ALTER TABLE members DROP COLUMN IF EXISTS "userId";

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS "openingAmountInHand" numeric(12, 2) NOT NULL DEFAULT '0';

ALTER TABLE members
  ADD COLUMN IF NOT EXISTS "openingBalanceOfCredit" numeric(12, 2) NOT NULL DEFAULT '0';

-- --- monthly_records: recreate with new columns ---
DROP TABLE IF EXISTS monthly_records;

CREATE TABLE monthly_records (
  id serial PRIMARY KEY,
  "userId" text NOT NULL,
  "memberId" integer NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  "monthlyFee" numeric(12, 2) NOT NULL DEFAULT '0',
  "loanReturned" numeric(12, 2) NOT NULL DEFAULT '0',
  "loanIssued" numeric(12, 2) NOT NULL DEFAULT '0',
  remarks text,
  "amountInHand" numeric(12, 2) NOT NULL DEFAULT '0',
  "balanceOfCredit" numeric(12, 2) NOT NULL DEFAULT '0',
  "createdAt" timestamp NOT NULL DEFAULT now(),
  "updatedAt" timestamp NOT NULL DEFAULT now(),
  UNIQUE ("userId", "memberId", year, month)
);

COMMIT;
