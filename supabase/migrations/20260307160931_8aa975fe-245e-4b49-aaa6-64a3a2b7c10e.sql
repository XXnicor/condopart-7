
-- Create a security definer function to get user's condo_id without RLS
CREATE OR REPLACE FUNCTION public.get_user_condo_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT condo_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can read profiles in same condo" ON public.profiles;

-- Recreate it using the security definer function
CREATE POLICY "Users can read profiles in same condo"
ON public.profiles
FOR SELECT
TO authenticated
USING (condo_id = public.get_user_condo_id(auth.uid()));

-- Also fix the alerts policy that has the same recursion issue
DROP POLICY IF EXISTS "Users can read alerts in same condo" ON public.alerts;

CREATE POLICY "Users can read alerts in same condo"
ON public.alerts
FOR SELECT
TO authenticated
USING (condo_id = public.get_user_condo_id(auth.uid()));

-- Fix sightings policy too
DROP POLICY IF EXISTS "Users can read sightings for alerts in same condo" ON public.sightings;

CREATE POLICY "Users can read sightings for alerts in same condo"
ON public.sightings
FOR SELECT
TO authenticated
USING (alert_id IN (
  SELECT id FROM public.alerts
  WHERE condo_id = public.get_user_condo_id(auth.uid())
));
