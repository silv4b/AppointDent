-- ================================================================
-- Admin: Excluir Usuário
-- ================================================================

CREATE OR REPLACE FUNCTION public.excluir_usuario(
  usuario_id UUID,
  caller_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.profiles WHERE id = caller_id;
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = usuario_id) THEN
    RAISE EXCEPTION 'Usuário não encontrado';
  END IF;

  DELETE FROM public.dentists WHERE profile_id = usuario_id;

  DELETE FROM public.profiles WHERE id = usuario_id;

  DELETE FROM auth.identities WHERE user_id = usuario_id;
  DELETE FROM auth.sessions WHERE user_id = usuario_id;
  DELETE FROM auth.users WHERE id = usuario_id;
END;
$$;
