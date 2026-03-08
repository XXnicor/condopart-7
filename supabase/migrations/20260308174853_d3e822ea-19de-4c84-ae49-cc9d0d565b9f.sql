
-- 1. Rename columns in alerts table
ALTER TABLE public.alerts RENAME COLUMN user_id TO reporter_id;
ALTER TABLE public.alerts RENAME COLUMN condo_id TO condominium_id;
ALTER TABLE public.alerts RENAME COLUMN pet_name TO title;

-- 2. Replace last_seen_location (text) with 3 new columns
ALTER TABLE public.alerts ADD COLUMN location_lat double precision;
ALTER TABLE public.alerts ADD COLUMN location_lng double precision;
ALTER TABLE public.alerts ADD COLUMN location_label text NOT NULL DEFAULT '';

-- Migrate existing data from last_seen_location JSON to new columns
UPDATE public.alerts
SET
  location_lat = CASE
    WHEN last_seen_location IS NOT NULL AND last_seen_location ~ '^\{' THEN (last_seen_location::json->>'lat')::double precision
    ELSE NULL
  END,
  location_lng = CASE
    WHEN last_seen_location IS NOT NULL AND last_seen_location ~ '^\{' THEN (last_seen_location::json->>'lng')::double precision
    ELSE NULL
  END,
  location_label = CASE
    WHEN last_seen_location IS NOT NULL AND last_seen_location ~ '^\{' THEN COALESCE(last_seen_location::json->>'label', '')
    ELSE COALESCE(last_seen_location, '')
  END;

ALTER TABLE public.alerts DROP COLUMN last_seen_location;

-- 3. Add type column
ALTER TABLE public.alerts ADD COLUMN type text NOT NULL DEFAULT 'lost';

-- 4. Rename condo_id in profiles
ALTER TABLE public.profiles RENAME COLUMN condo_id TO condominium_id;

-- 5. Update get_user_condo_id function
CREATE OR REPLACE FUNCTION public.get_user_condo_id(_user_id uuid)
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT condominium_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- 6. Drop old RLS policies on alerts
DROP POLICY IF EXISTS "Users can create alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can read alerts in same condo" ON public.alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;

-- 7. Recreate RLS policies on alerts with new column names
CREATE POLICY "Users can create alerts"
ON public.alerts FOR INSERT TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can read alerts in same condo"
ON public.alerts FOR SELECT TO authenticated
USING (condominium_id = get_user_condo_id(auth.uid()));

CREATE POLICY "Users can update own alerts"
ON public.alerts FOR UPDATE TO authenticated
USING (auth.uid() = reporter_id);

-- 8. Drop old RLS policies on profiles that reference condo_id
DROP POLICY IF EXISTS "Users can read profiles in same condo" ON public.profiles;

-- 9. Recreate profile policy with new column name
CREATE POLICY "Users can read profiles in same condo"
ON public.profiles FOR SELECT TO authenticated
USING (condominium_id = get_user_condo_id(auth.uid()));
