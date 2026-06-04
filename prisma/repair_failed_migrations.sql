-- Idempotent production repair for Prisma migration:
-- 20260601000000_add_password_reset_tokens
--
-- Render currently fails with Prisma P3009 because this migration is marked as
-- failed in Neon. This script makes the expected schema state true before the
-- Docker entrypoint marks the migration as applied and runs migrate deploy.

CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id"         TEXT         NOT NULL,
    "user_id"    TEXT         NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "password_reset_tokens_user_id_idx"
    ON "password_reset_tokens"("user_id");

CREATE INDEX IF NOT EXISTS "password_reset_tokens_expires_at_idx"
    ON "password_reset_tokens"("expires_at");

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'password_reset_tokens_user_id_fkey'
    ) THEN
        ALTER TABLE "password_reset_tokens"
            ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
            FOREIGN KEY ("user_id") REFERENCES "users"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
