-- ================================================================
-- Admin: Gerenciamento de Usuários
-- ================================================================
-- Permite que o admin crie e liste usuários pelo dashboard.
-- Tudo via SECURITY DEFINER (anon key respeita RLS, sem service_role).
-- ================================================================

-- 1. Criar usuário (email + senha + role)
--    O trigger handle_new_user() cria o profile automaticamente.
--    Aqui apenas atualizamos a role e, se dentista, criamos o registro.

CREATE OR REPLACE FUNCTION public.criar_usuario(
  usuario_email TEXT,
  usuario_senha TEXT,
  usuario_nome  TEXT,
  usuario_role  TEXT,
  especialidade TEXT DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
DECLARE
  caller_role TEXT;
  user_id uuid;
  existing_id uuid;
BEGIN
  -- Somente admin pode criar usuários
  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = auth.uid();
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem criar usuários';
  END IF;

  -- Validar role
  IF usuario_role NOT IN ('admin', 'dentist', 'receptionist') THEN
    RAISE EXCEPTION 'Função inválida: %', usuario_role;
  END IF;

  -- Verificar se email já existe
  SELECT u.id INTO existing_id FROM auth.users u WHERE u.email = usuario_email;
  IF existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'Já existe um usuário com este email';
  END IF;

  user_id := gen_random_uuid();

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_sent_at,
    confirmation_token, recovery_token, email_change_token_new,
    email_change_token_current, email_change, phone_change,
    phone_change_token, reauthentication_token, last_sign_in_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', user_id,
    'authenticated', 'authenticated',
    usuario_email, extensions.crypt(usuario_senha, extensions.gen_salt('bf')),
    now(), now(),
    '', '', '', '', '', '', '', '', now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object('name', usuario_nome),
    now(), now()
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    user_id, user_id,
    jsonb_build_object('sub', user_id, 'email', usuario_email),
    'email', usuario_email,
    now(), now(), now()
  );

  -- Atualizar a role no profile (trigger cria como 'admin')
  UPDATE public.profiles SET role = usuario_role WHERE id = user_id;

  -- Se for dentista, criar registro em dentists
  IF usuario_role = 'dentist' THEN
    INSERT INTO public.dentists (profile_id, name, specialty, active)
    VALUES (user_id, usuario_nome, COALESCE(especialidade, ''), true);
  END IF;

  RETURN user_id;
END;
$$;

-- 2. Listar usuários (profiles + email de auth.users)

CREATE OR REPLACE FUNCTION public.listar_usuarios(
  page_size INT DEFAULT 20,
  page_num  INT DEFAULT 1,
  caller_id UUID DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  name TEXT,
  email TEXT,
  role TEXT,
  dentist_id uuid,
  created_at TIMESTAMPTZ,
  total BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public, extensions'
AS $$
DECLARE
  caller_role TEXT;
  v_total BIGINT;
  v_offset INT;
  v_caller UUID;
BEGIN
  v_caller := COALESCE(caller_id, auth.uid());

  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Usuário não autenticado';
  END IF;

  SELECT p.role INTO caller_role FROM public.profiles p WHERE p.id = v_caller;
  IF caller_role IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'Apenas administradores podem listar usuários';
  END IF;

  -- Total de registros (para paginação)
  SELECT COUNT(*)::BIGINT INTO v_total FROM public.profiles;

  v_offset := (page_num - 1) * page_size;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    u.email,
    p.role,
    d.id AS dentist_id,
    p.created_at,
    v_total
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.dentists d ON d.profile_id = p.id
  ORDER BY p.created_at DESC
  LIMIT page_size
  OFFSET v_offset;
END;
$$;
