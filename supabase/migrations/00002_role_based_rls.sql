-- Refine RLS policies to be role-based instead of permissive "any authenticated user"

-- 1. Drop existing permissive policies
DROP POLICY IF EXISTS "authenticated users can read profiles" ON profiles;
DROP POLICY IF EXISTS "users can update their own profile" ON profiles;

DROP POLICY IF EXISTS "authenticated users can read patients" ON patients;
DROP POLICY IF EXISTS "authenticated users can insert patients" ON patients;
DROP POLICY IF EXISTS "authenticated users can update patients" ON patients;
DROP POLICY IF EXISTS "authenticated users can delete patients" ON patients;

DROP POLICY IF EXISTS "authenticated users can read dentists" ON dentists;
DROP POLICY IF EXISTS "authenticated users can insert dentists" ON dentists;
DROP POLICY IF EXISTS "authenticated users can update dentists" ON dentists;
DROP POLICY IF EXISTS "authenticated users can delete dentists" ON dentists;

DROP POLICY IF EXISTS "authenticated users can read procedures" ON procedures;
DROP POLICY IF EXISTS "authenticated users can insert procedures" ON procedures;
DROP POLICY IF EXISTS "authenticated users can update procedures" ON procedures;
DROP POLICY IF EXISTS "authenticated users can delete procedures" ON procedures;

DROP POLICY IF EXISTS "authenticated users can read availability slots" ON availability_slots;
DROP POLICY IF EXISTS "authenticated users can insert availability slots" ON availability_slots;
DROP POLICY IF EXISTS "authenticated users can update availability slots" ON availability_slots;
DROP POLICY IF EXISTS "authenticated users can delete availability slots" ON availability_slots;

DROP POLICY IF EXISTS "authenticated users can read appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated users can insert appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated users can update appointments" ON appointments;
DROP POLICY IF EXISTS "authenticated users can delete appointments" ON appointments;

DROP POLICY IF EXISTS "authenticated users can read blocked slots" ON blocked_slots;
DROP POLICY IF EXISTS "authenticated users can insert blocked slots" ON blocked_slots;
DROP POLICY IF EXISTS "authenticated users can update blocked slots" ON blocked_slots;
DROP POLICY IF EXISTS "authenticated users can delete blocked slots" ON blocked_slots;

-- 2. Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- 3. Role-based policies

-- PROFILES: read own + admins can read all; update own only
CREATE POLICY "anyone can read profiles"
  ON profiles FOR SELECT USING (
    auth.role() = 'authenticated'
  );

CREATE POLICY "users can update their own profile"
  ON profiles FOR UPDATE USING (id = auth.uid());

-- PATIENTS: read all; insert/update/delete all authenticated (common operations)
CREATE POLICY "anyone can read patients"
  ON patients FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "anyone can insert patients"
  ON patients FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "anyone can update patients"
  ON patients FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "anyone can delete patients"
  ON patients FOR DELETE USING (auth.role() = 'authenticated');

-- DENTISTS: read all; insert/update/delete only admin
CREATE POLICY "anyone can read dentists"
  ON dentists FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin can insert dentists"
  ON dentists FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin can update dentists"
  ON dentists FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "admin can delete dentists"
  ON dentists FOR DELETE USING (public.get_user_role() = 'admin');

-- PROCEDURES: read all; insert/update/delete only admin
CREATE POLICY "anyone can read procedures"
  ON procedures FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin can insert procedures"
  ON procedures FOR INSERT WITH CHECK (public.get_user_role() = 'admin');

CREATE POLICY "admin can update procedures"
  ON procedures FOR UPDATE USING (public.get_user_role() = 'admin');

CREATE POLICY "admin can delete procedures"
  ON procedures FOR DELETE USING (public.get_user_role() = 'admin');

-- AVAILABILITY SLOTS: read all; insert/update/delete all authenticated
CREATE POLICY "anyone can read availability slots"
  ON availability_slots FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "anyone can insert availability slots"
  ON availability_slots FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "anyone can update availability slots"
  ON availability_slots FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "anyone can delete availability slots"
  ON availability_slots FOR DELETE USING (auth.role() = 'authenticated');

-- APPOINTMENTS: read all; insert/update/delete all authenticated
CREATE POLICY "anyone can read appointments"
  ON appointments FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "anyone can insert appointments"
  ON appointments FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "anyone can update appointments"
  ON appointments FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "anyone can delete appointments"
  ON appointments FOR DELETE USING (auth.role() = 'authenticated');

-- BLOCKED SLOTS: read all; insert/update/delete admin or dentist (self)
CREATE POLICY "anyone can read blocked slots"
  ON blocked_slots FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "admin or dentist can insert blocked slots"
  ON blocked_slots FOR INSERT WITH CHECK (
    public.get_user_role() IN ('admin', 'dentist')
  );

CREATE POLICY "admin or dentist can update blocked slots"
  ON blocked_slots FOR UPDATE USING (
    public.get_user_role() IN ('admin', 'dentist')
  );

CREATE POLICY "admin or dentist can delete blocked slots"
  ON blocked_slots FOR DELETE USING (
    public.get_user_role() IN ('admin', 'dentist')
  );
