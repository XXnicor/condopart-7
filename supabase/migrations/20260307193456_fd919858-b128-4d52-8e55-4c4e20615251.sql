
-- Enable realtime for sightings
ALTER PUBLICATION supabase_realtime ADD TABLE public.sightings;

-- Allow users to delete their own sightings
CREATE POLICY "Users can delete own sightings"
  ON public.sightings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
