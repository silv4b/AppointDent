-- ================================================================
-- Atestados — certificates
-- ================================================================

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  dentist_id UUID NOT NULL REFERENCES dentists(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  general_observations TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Admin: full access
CREATE POLICY "admin all on certificates"
  ON certificates
  USING (public.get_user_role() = 'admin')
  WITH CHECK (public.get_user_role() = 'admin');

-- Dentist: read all, write own
CREATE POLICY "dentist read on certificates"
  ON certificates FOR SELECT
  USING (public.get_user_role() = 'dentist');

CREATE POLICY "dentist insert own certificates"
  ON certificates FOR INSERT
  WITH CHECK (
    public.get_user_role() = 'dentist'
    AND dentist_id IN (
      SELECT id FROM dentists WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "dentist update own certificates"
  ON certificates FOR UPDATE
  USING (
    public.get_user_role() = 'dentist'
    AND dentist_id IN (
      SELECT id FROM dentists WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "dentist delete own certificates"
  ON certificates FOR DELETE
  USING (
    public.get_user_role() = 'dentist'
    AND dentist_id IN (
      SELECT id FROM dentists WHERE profile_id = auth.uid()
    )
  );

-- Receptionist: read only
CREATE POLICY "receptionist read on certificates"
  ON certificates FOR SELECT
  USING (public.get_user_role() = 'receptionist');
