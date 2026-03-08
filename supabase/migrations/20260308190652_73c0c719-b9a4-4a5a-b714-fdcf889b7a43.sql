CREATE POLICY "Public can read active and found alerts"
  ON public.alerts FOR SELECT
  TO anon
  USING (status = 'active' OR status = 'found');