-- ============================================
-- Fix: NULL token columns in auth.users
-- ============================================
-- GoTrue espera string, não NULL. Seeds antigos
-- (seed.sql e 00032) deixaram colunas como NULL,
-- causando "Database error querying schema".
-- ============================================

UPDATE auth.users SET
  recovery_token             = COALESCE(recovery_token, ''),
  confirmation_token         = COALESCE(confirmation_token, ''),
  email_change_token_new     = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token     = COALESCE(reauthentication_token, ''),
  phone_change_token         = COALESCE(phone_change_token, ''),
  email_change               = COALESCE(email_change, ''),
  phone_change               = COALESCE(phone_change, '')
WHERE recovery_token IS NULL
   OR confirmation_token IS NULL
   OR email_change_token_new IS NULL
   OR email_change_token_current IS NULL
   OR reauthentication_token IS NULL
   OR phone_change_token IS NULL
   OR email_change IS NULL
   OR phone_change IS NULL;
