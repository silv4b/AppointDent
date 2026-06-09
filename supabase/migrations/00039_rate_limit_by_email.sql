-- ================================================================
-- Rate limit by email (H-08 / M-09)
-- ================================================================
-- Estende a tabela login_attempts para suportar rate-limit
-- por email + ação (login, password_change), mantendo compatibilidade
-- com o rate-limit por IP existente.
-- ================================================================

-- Adiciona colunas para rate-limit por email
ALTER TABLE login_attempts
  ADD COLUMN email TEXT,
  ADD COLUMN action TEXT NOT NULL DEFAULT 'login';

-- Índice composto para consultas por email + ação
CREATE INDEX IF NOT EXISTS idx_login_attempts_email_action
  ON login_attempts (email, action, attempted_at DESC);

-- Função de rate-limit por email (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION check_rate_limit_by_email(
  p_email TEXT,
  p_action TEXT,
  p_max_attempts INT DEFAULT 5,
  p_window_minutes INT DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_count INT;
BEGIN
  -- Limpa tentativas antigas do mesmo email+ação
  DELETE FROM public.login_attempts
  WHERE email = p_email
    AND action = p_action
    AND attempted_at < now() - (p_window_minutes || ' minutes')::INTERVAL;

  -- Conta tentativas no período
  SELECT COUNT(*) INTO recent_count
  FROM public.login_attempts
  WHERE login_attempts.email = p_email
    AND login_attempts.action = p_action
    AND attempted_at > now() - (p_window_minutes || ' minutes')::INTERVAL;

  IF recent_count >= p_max_attempts THEN
    RETURN false;
  END IF;

  -- Registra a tentativa
  INSERT INTO public.login_attempts (email, action) VALUES (p_email, p_action);

  RETURN true;
END;
$$;
