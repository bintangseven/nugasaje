DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan') THEN
    CREATE TYPE public.user_plan AS ENUM ('trial', 'pro');
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan public.user_plan NOT NULL DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS generations_used integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pro_until timestamptz;