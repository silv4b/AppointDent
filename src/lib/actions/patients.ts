"use server"

import { requireAuth } from "@/lib/supabase/guard"
import { revalidatePath } from "next/cache"
import { patientSchema, quickPatientSchema } from "@/lib/schemas"
import { ok, err } from "@/lib/utils/action-response"
import { getUserDentistFilter } from "@/lib/utils/access-filter"
import { NULL_UUID } from "@/lib/utils/constants"
import { z } from "zod"

export async function getPatients() {
  try {
    const { supabase } = await requireAuth()

    const dentistFilter = await getUserDentistFilter()
    if (dentistFilter !== null) {
      const { data: patientsWithAccess } = await supabase
        .from("appointments")
        .select("patient_id")
        .in("dentist_id", dentistFilter.length > 0 ? dentistFilter : [NULL_UUID])

      const patientIds = [...new Set(patientsWithAccess?.map((a) => a.patient_id) ?? [])]

      if (patientIds.length > 0) {
        const { data } = await supabase.from("patients").select("id, name, cpf, phone, email, birth_date, notes, active").in("id", patientIds).order("name")
        return data ?? []
      }

      return []
    }

    const { data } = await supabase.from("patients").select("id, name, cpf, phone, email, birth_date, notes, active").order("name")
    return data ?? []
  } catch {
    return []
  }
}

export async function createPatient(formData: FormData) {
  try {
    const { supabase } = await requireAuth()

    const raw = Object.fromEntries(formData)
    const parsed = patientSchema.safeParse(raw)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name: parsed.data.name,
        cpf: parsed.data.cpf || null,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
        birth_date: parsed.data.birth_date || null,
        notes: parsed.data.notes || null,
        active: parsed.data.active ?? true,
      })
      .select("id, name")
      .single()

    if (error) return err(error.message)
    revalidatePath("/pacientes")
    return ok({ data })
  } catch {
    return err("Erro ao criar paciente")
  }
}

export async function quickCreatePatient(formData: FormData) {
  try {
    const { supabase } = await requireAuth()

    const raw = Object.fromEntries(formData)
    const parsed = quickPatientSchema.safeParse(raw)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

    const { data, error } = await supabase
      .from("patients")
      .insert({
        name: parsed.data.name,
        phone: parsed.data.phone || null,
        email: parsed.data.email || null,
      })
      .select("id, name, email")
      .single()

    if (error) return err(error.message)
    revalidatePath("/pacientes")
    return ok(data)
  } catch {
    return err("Erro ao criar paciente")
  }
}

export async function updatePatient(formData: FormData) {
  try {
    const { supabase } = await requireAuth()
    const raw = Object.fromEntries(formData)
    const parsed = patientSchema.extend({ id: z.string().uuid() }).safeParse(raw)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

    const { id, ...fields } = parsed.data

    const { error } = await supabase.from("patients").update({
      name: fields.name,
      cpf: fields.cpf || null,
      phone: fields.phone || null,
      email: fields.email || null,
      birth_date: fields.birth_date || null,
      notes: fields.notes || null,
      active: fields.active,
    }).eq("id", id)

    if (error) return err(error.message)
    revalidatePath("/pacientes")
    return ok()
  } catch {
    return err("Erro ao atualizar paciente")
  }
}

export async function getPatientsPaginated(
  page: number,
  pageSize: number,
  search?: string,
  sortColumn?: string,
  sortDir?: string,
) {
  try {
    const { supabase } = await requireAuth()

    const validSortColumns = ["name", "cpf", "email", "birth_date", "active"]
    const col = validSortColumns.includes(sortColumn ?? "") ? sortColumn! : "name"
    const dir = sortDir === "desc" ? "desc" : "asc"

    const dentistFilter = await getUserDentistFilter()

    let patientIds: string[] | null = null
    if (dentistFilter !== null) {
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_id")
        .in("dentist_id", dentistFilter.length > 0 ? dentistFilter : [NULL_UUID])
      patientIds = [...new Set((appts ?? []).map((a) => a.patient_id))]
    }

    let query = supabase
      .from("patients")
      .select("id, name, cpf, phone, email, birth_date, notes, active, created_at", { count: "exact" })

    if (search) {
      query = query.or(`name.ilike.%${search}%,cpf.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`)
    }

    if (patientIds !== null) {
      query = query.in("id", patientIds.length > 0 ? patientIds : [NULL_UUID])
    }

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, count } = await query
      .order(col, { ascending: dir === "asc" })
      .range(from, to)

    return ok({ data: data ?? [], total: count ?? 0 })
  } catch {
    return err("Erro ao buscar pacientes")
  }
}

export async function getPatientDetails(id: string) {
  try {
    const { supabase } = await requireAuth()
    const { data } = await supabase
      .from("patients")
      .select("id, name, cpf, phone, email, birth_date, notes")
      .eq("id", id)
      .single()
    return ok(data)
  } catch {
    return err("Paciente não encontrado")
  }
}

export async function deletePatient(formData: FormData) {
  try {
    const { supabase, user } = await requireAuth()
    const raw = Object.fromEntries(formData)
    const parsed = z.object({ id: z.string().uuid() }).safeParse(raw)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (profile?.role !== "admin" && profile?.role !== "dentist") {
      return err("Acesso negado")
    }

    const { error } = await supabase.from("patients").delete().eq("id", parsed.data.id)
    if (error) return err(error.message)
    revalidatePath("/pacientes")
    return ok()
  } catch {
    return err("Erro ao excluir paciente")
  }
}
