-- Create helper function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_admin_of_condo(_user_id uuid, _condo_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _user_id AND role = 'admin' AND condominium_id = _condo_id
  );
$$;

-- Drop old recursive policy
DROP POLICY IF EXISTS "Admin pode atualizar qualquer perfil" ON profiles;

-- New safe policy: admin can update profiles in same condo
CREATE POLICY "Admin pode atualizar perfis do mesmo condo"
ON profiles FOR UPDATE TO authenticated
USING (
  public.is_admin_of_condo(auth.uid(), condominium_id)
);