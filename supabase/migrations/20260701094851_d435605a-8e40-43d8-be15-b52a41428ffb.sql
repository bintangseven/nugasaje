-- Cegah user mengubah kolom sensitif (plan, pro_until, generations_used, generations_date)
-- lewat REST API. Kolom ini hanya boleh diubah oleh service_role (webhook Pakasir / server admin).
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Bypass jika dijalankan oleh service_role (webhook / admin server)
  IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'Not allowed to modify plan directly';
  END IF;
  IF NEW.pro_until IS DISTINCT FROM OLD.pro_until THEN
    RAISE EXCEPTION 'Not allowed to modify pro_until directly';
  END IF;
  IF NEW.generations_used IS DISTINCT FROM OLD.generations_used THEN
    RAISE EXCEPTION 'Not allowed to modify generations_used directly';
  END IF;
  IF NEW.generations_date IS DISTINCT FROM OLD.generations_date THEN
    RAISE EXCEPTION 'Not allowed to modify generations_date directly';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_prevent_privilege_escalation ON public.profiles;
CREATE TRIGGER profiles_prevent_privilege_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_privilege_escalation();