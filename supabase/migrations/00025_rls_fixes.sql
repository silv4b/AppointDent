-- ================================================================
-- Fix: RLS policies — lacunas e permissões excessivas
-- ================================================================
-- Cobre:
--   1. clinic_hours (sem RLS — crítico)
--   2. patients DELETE (qualquer auth pode excluir)
--   3. appointments DELETE (qualquer auth pode excluir)
--   4. notifications INSERT/UPDATE/DELETE (qualquer auth pode
--      criar notificações para qualquer usuário)
--   5. receptionist_dentists (sem UPDATE)
-- ================================================================

-- =====================
-- 1. clinic_hours
-- =====================
ALTER TABLE clinic_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read clinic_hours"
  ON clinic_hours FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "admin can insert clinic_hours"
  ON clinic_hours FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin can update clinic_hours"
  ON clinic_hours FOR UPDATE
  USING (public.get_user_role() = 'admin');

CREATE POLICY "admin can delete clinic_hours"
  ON clinic_hours FOR DELETE
  USING (public.get_user_role() = 'admin');

-- =====================
-- 2. patients DELETE
-- =====================
-- Antes: auth.role() = 'authenticated' (sem restrição)
-- Depois: somente admin/dentist
DROP POLICY IF EXISTS "authenticated users can delete patients" ON patients;

CREATE POLICY "admin or dentist can delete patients"
  ON patients FOR DELETE
  USING (public.get_user_role() IN ('admin', 'dentist'));

-- =====================
-- 3. appointments DELETE
-- =====================
-- Antes: auth.role() = 'authenticated' (sem restrição)
DROP POLICY IF EXISTS "authenticated users can delete appointments" ON appointments;

CREATE POLICY "admin or dentist can delete appointments"
  ON appointments FOR DELETE
  USING (public.get_user_role() IN ('admin', 'dentist'));

-- =====================
-- 4. notifications — restringir INSERT/DELETE
-- =====================
-- Antes: INSERT permitia qualquer user_id, DELETE não existia
DROP POLICY IF EXISTS "authenticated users can insert notifications" ON notifications;

CREATE POLICY "users can insert own notifications"
  ON notifications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =====================
-- 5. receptionist_dentists — adicionar UPDATE
-- =====================
CREATE POLICY "authenticated users can update receptionist_dentists"
  ON receptionist_dentists FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
