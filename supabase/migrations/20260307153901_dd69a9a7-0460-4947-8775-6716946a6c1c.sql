
-- Create pet-photos storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('pet-photos', 'pet-photos', true);

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload pet photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pet-photos');

-- Allow public read
CREATE POLICY "Anyone can read pet photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'pet-photos');
