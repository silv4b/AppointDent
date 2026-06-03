-- ================================================================
-- Rate limit: login_attempts table
-- ================================================================
-- Substitui o Map em memória por uma tabela persistente,
-- funcionando em múltiplas instâncias e entre deploys.
-- ================================================================

CREATE TABLE login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_attempts_ip_time ON login_attempts (ip_address, attempted_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Função de rate-limit (SECURITY DEFINER para bypass RLS)
CREATE OR REPLACE FUNCTION check_login_rate_limit(ip_address TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  recent_count INT;
BEGIN
  -- Limpa tentativas com mais de 1 hora
  DELETE FROM public.login_attempts
  WHERE attempted_at < now() - INTERVAL '1 hour';

  -- Conta tentativas no último minuto
  SELECT COUNT(*) INTO recent_count
  FROM public.login_attempts
  WHERE login_attempts.ip_address = check_login_rate_limit.ip_address
    AND attempted_at > now() - INTERVAL '1 minute';

  IF recent_count >= 5 THEN
    RETURN false;
  END IF;

  -- Registra a tentativa
  INSERT INTO public.login_attempts (ip_address) VALUES (ip_address);

  RETURN true;
END;
$$;
