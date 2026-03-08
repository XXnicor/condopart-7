
-- 1. Recreate trigger for auto-creating profiles on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 2. Add INSERT policy on profiles for fallback
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- 3. Seed condos
INSERT INTO public.condos (name) VALUES
  ('Residencial das Flores'),
  ('Condomínio Solar'),
  ('Edifício Central')
ON CONFLICT DO NOTHING;
