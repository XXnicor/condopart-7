
-- Insert missing profile for existing user
INSERT INTO public.profiles (id, full_name)
VALUES ('2d66bd60-7ee4-4408-ac4e-7ee9e6ef15cc', 'Nico')
ON CONFLICT (id) DO NOTHING;

-- Create the trigger on auth.users so future signups auto-create profiles
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
