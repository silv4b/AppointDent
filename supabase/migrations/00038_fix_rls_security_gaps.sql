-- ================================================================
-- Fix: RLS security gaps identified in security audit (2026-06-08)
-- ================================================================
-- Corrige:
--   1. receptionist_dentists — todas as operações sem escopo
--   2. dentist_procedures — todas as operações sem escopo
--   3. prescriptions — SELECT de recepcionista sem escopo
--   4. anamnese_sessions — UPDATE/DELETE sem escopo de recepcionista
--      e sem WITH CHECK no UPDATE
--   5. blocked_slots — SELECT sem escopo por dentista
-- ================================================================

-- ================================================================
-- 1. receptionist_dentists
-- ================================================================
-- Antes: todas as operações permitidas para qualquer authenticated
-- Depois: SELECT escopado, INSERT/UPDATE/DELETE apenas admin

DROP POLICY IF EXISTS "authenticated users can select receptionist_dentists" ON public.receptionist_dentists;
DROP POLICY IF EXISTS "authenticated users can insert receptionist_dentists" ON public.receptionist_dentists;
DROP POLICY IF EXISTS "authenticated users can update receptionist_dentists" ON public.receptionist_dentists;
DROP POLICY IF EXISTS "authenticated users can delete receptionist_dentists" ON public.receptionist_dentists;

-- SELECT: admin vê tudo, dentista vê onde é vinculado,
-- recepcionista vê seus próprios vínculos
CREATE POLICY "select receptionist_dentists by scope" ON public.receptionist_dentists
  FOR SELECT
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
    OR (public.get_user_role() = 'receptionist' AND receptionist_id = auth.uid())
  );

-- INSERT/UPDATE/DELETE: apenas admin
CREATE POLICY "admin insert receptionist_dentists" ON public.receptionist_dentists
  FOR INSERT
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin update receptionist_dentists" ON public.receptionist_dentists
  FOR UPDATE
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin delete receptionist_dentists" ON public.receptionist_dentists
  FOR DELETE
  USING (public.get_user_role() = 'admin');

-- ================================================================
-- 2. dentist_procedures
-- ================================================================
-- Antes: todas as operações permitidas para qualquer authenticated
-- Depois: admin full, dentista só próprios, recepcionista read-only
-- vinculados

DROP POLICY IF EXISTS "authenticated users can read dentist_procedures" ON public.dentist_procedures;
DROP POLICY IF EXISTS "authenticated users can insert dentist_procedures" ON public.dentist_procedures;
DROP POLICY IF EXISTS "authenticated users can update dentist_procedures" ON public.dentist_procedures;
DROP POLICY IF EXISTS "authenticated users can delete dentist_procedures" ON public.dentist_procedures;

CREATE POLICY "select dentist_procedures by scope" ON public.dentist_procedures
  FOR SELECT
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
    OR (public.get_user_role() = 'receptionist' AND dentist_id IN (SELECT dentist_id FROM public.receptionist_dentists WHERE receptionist_id = auth.uid()))
  );

CREATE POLICY "insert dentist_procedures by scope" ON public.dentist_procedures
  FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  );

CREATE POLICY "update dentist_procedures by scope" ON public.dentist_procedures
  FOR UPDATE
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  )
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  );

CREATE POLICY "delete dentist_procedures by scope" ON public.dentist_procedures
  FOR DELETE
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  );

-- ================================================================
-- 3. prescriptions — SELECT de recepcionista escopado
-- ================================================================
-- Antes: recepcionista podia ler TODAS as prescrições
-- Depois: recepcionista só lê prescrições dos dentistas vinculados

DROP POLICY IF EXISTS "receptionist read on prescriptions" ON public.prescriptions;

CREATE POLICY "receptionist read prescriptions by scope" ON public.prescriptions
  FOR SELECT
  USING (
    public.get_user_role() = 'receptionist'
    AND dentist_id IN (SELECT dentist_id FROM public.receptionist_dentists WHERE receptionist_id = auth.uid())
  );

-- ================================================================
-- 4. anamnese_sessions — UPDATE/DELETE escopados e WITH CHECK
-- ================================================================
-- Antes: UPDATE/DELETE usavam (SELECT role FROM profiles) diretamente
-- e não incluíam recepcionista ou WITH CHECK no UPDATE
-- Depois: usam public.get_user_role(), incluem WITH CHECK no UPDATE

DROP POLICY IF EXISTS "Dentistas atualizam próprias, admins todas" ON public.anamnese_sessions;
DROP POLICY IF EXISTS "Dentistas deletam próprias, admins todas" ON public.anamnese_sessions;

CREATE POLICY "update anamnese sessions by scope" ON public.anamnese_sessions
  FOR UPDATE
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  )
  WITH CHECK (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  );

CREATE POLICY "delete anamnese sessions by scope" ON public.anamnese_sessions
  FOR DELETE
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
  );

-- ================================================================
-- 5. blocked_slots — SELECT escopado por dentista
-- ================================================================
-- Antes: qualquer authenticated podia ler todos os blocked_slots
-- Depois: admin vê tudo, dentista vê próprios, recepcionista vê
-- dos vinculados

DROP POLICY IF EXISTS "anyone can read blocked slots" ON public.blocked_slots;

CREATE POLICY "select blocked_slots by scope" ON public.blocked_slots
  FOR SELECT
  USING (
    public.get_user_role() = 'admin'
    OR (public.get_user_role() = 'dentist' AND dentist_id IN (SELECT id FROM public.dentists WHERE profile_id = auth.uid()))
    OR (public.get_user_role() = 'receptionist' AND dentist_id IN (SELECT dentist_id FROM public.receptionist_dentists WHERE receptionist_id = auth.uid()))
  );
