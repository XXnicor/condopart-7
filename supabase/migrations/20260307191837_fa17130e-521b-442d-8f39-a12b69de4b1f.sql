
-- Drop the restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can read profiles in same condo" ON public.profiles;

-- Own profile: permissive so users can ALWAYS read their own profile
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Same condo: permissive so users can also read profiles in their condo
CREATE POLICY "Users can read profiles in same condo"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (condo_id = get_user_condo_id(auth.uid()));
