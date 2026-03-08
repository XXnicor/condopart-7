CREATE TABLE public.pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  condominium_id uuid REFERENCES public.condos(id),
  name text NOT NULL,
  species text,
  breed text,
  color text,
  photo_url text,
  qr_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own pets" ON public.pets
  FOR SELECT TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own pets" ON public.pets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own pets" ON public.pets
  FOR UPDATE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own pets" ON public.pets
  FOR DELETE TO authenticated USING (auth.uid() = owner_id);