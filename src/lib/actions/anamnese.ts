"use server"

import { requireAuth } from "@/lib/supabase/guard"
import { revalidatePath } from "next/cache"
import { anamneseSessionSchema, anamneseSessionUpdateSchema } from "@/lib/schemas"
import { ok, err } from "@/lib/utils/action-response"
import { getUserDentistFilter } from "@/lib/utils/access-filter"
import { NULL_UUID } from "@/lib/utils/constants"

export async function saveAnamneseSession(formData: FormData) {
  try {
    const { supabase, user } = await requireAuth()

    const raw = Object.fromEntries(formData)
    const parsed = anamneseSessionSchema.safeParse(raw)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile) return err("Perfil de usuário não encontrado")

    let dentistId: string

    if (profile.role === "dentist") {
      const { data: dentist } = await supabase
        .from("dentists")
        .select("id")
        .eq("profile_id", user.id)
        .single()

      if (!dentist) return err("Perfil de dentista não encontrado")
      dentistId = dentist.id
    } else {
      if (!parsed.data.dentist_id) return err("Selecione um dentista")
      dentistId = parsed.data.dentist_id
    }

    const { error } = await supabase.from("anamnese_sessions").insert({
      title: parsed.data.title,
      appointment_id: parsed.data.appointment_id || null,
      dentist_id: dentistId,
      patient_id: parsed.data.patient_id,
      notes: parsed.data.notes || null,
      fields: parsed.data.fields,
    })

    if (error) return err(error.message)
    revalidatePath("/anamnese")
    return ok()
  } catch {
    return err("Erro ao salvar sessão de anamnese")
  }
}

export async function updateAnamneseSession(formData: FormData) {
  try {
    const { supabase } = await requireAuth()

    const raw = Object.fromEntries(formData)
    const parsed = anamneseSessionUpdateSchema.safeParse(raw)
    if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

    const { error } = await supabase
      .from("anamnese_sessions")
      .update({
        ...(parsed.data.title !== undefined && { title: parsed.data.title }),
        ...(parsed.data.fields !== undefined && { fields: parsed.data.fields }),
        ...(parsed.data.notes !== undefined && { notes: parsed.data.notes }),
      })
      .eq("id", parsed.data.id)

    if (error) return err(error.message)
    revalidatePath("/anamnese")
    return ok()
  } catch {
    return err("Erro ao atualizar sessão de anamnese")
  }
}

export async function deleteAnamneseSession(sessionId: string) {
  try {
    const { supabase } = await requireAuth()

    const { error } = await supabase
      .from("anamnese_sessions")
      .delete()
      .eq("id", sessionId)

    if (error) return err(error.message)
    revalidatePath("/anamnese")
    return ok()
  } catch {
    return err("Erro ao excluir sessão de anamnese")
  }
}

export async function searchPatients(query: string) {
  try {
    const { supabase } = await requireAuth()

    let baseQuery = supabase
      .from("patients")
      .select("id, name")
      .ilike("name", `%${query}%`)
      .order("name")
      .limit(20)

    const dentistFilter = await getUserDentistFilter()
    if (dentistFilter !== null) {
      const { data: patientsWithAccess } = await supabase
        .from("appointments")
        .select("patient_id")
        .in("dentist_id", dentistFilter.length > 0 ? dentistFilter : [NULL_UUID])

      const patientIds = [...new Set(patientsWithAccess?.map((a) => a.patient_id) ?? [])]

      if (patientIds.length > 0) {
        baseQuery = baseQuery.in("id", patientIds)
      } else {
        baseQuery = baseQuery.in("id", [])
      }
    }

    const { data } = await baseQuery
    return data ?? []
  } catch {
    return []
  }
}

export async function getAnamneseForExport(sessionId: string) {
  try {
    const { supabase } = await requireAuth()

    const { data: session } = await supabase
      .from("anamnese_sessions")
      .select("id, title, fields, created_at, patients(name, phone), dentists(name)")
      .eq("id", sessionId)
      .single()

    if (!session) return err("Sessão não encontrada")

    const patient = session.patients as { name: string; phone: string | null } | null
    const dentist = session.dentists as { name: string } | null

    return ok({
      patientName: patient?.name ?? "Paciente",
      patientPhone: patient?.phone ?? null,
      dentistName: dentist?.name ?? "Dentista",
      sessionTitle: session.title ?? "Sessão de Anamnese",
      createdAt: session.created_at,
      fields: session.fields as { label: string; content: string }[],
    })
  } catch {
    return err("Erro ao buscar dados da sessão")
  }
}

export async function getPatientAnamneseData(pacienteId: string) {
  try {
    const { supabase } = await requireAuth()

    const dentistFilter = await getUserDentistFilter()

    const [dentistsRes, patientRes] = await Promise.all([
      supabase.from("dentists").select("id, name").order("name"),
      supabase.from("patients").select("id, name, phone, email, birth_date").eq("id", pacienteId).single(),
    ])

    let apptsQuery = supabase
      .from("appointments")
      .select("id, patient_id, dentist_id, procedure_id, start_time, end_time, status, notes, started_at, finished_at, created_at, updated_at, return_to_id, patients(name), dentists(name), procedures(name, color, duration_minutes)")
      .eq("patient_id", pacienteId)

    let sessionsQuery = supabase
      .from("anamnese_sessions")
      .select("id, title, appointment_id, dentist_id, patient_id, notes, fields, created_at, appointments(patients(name), dentists(name)), patients(name), dentists(name)")
      .eq("patient_id", pacienteId)

    if (dentistFilter !== null) {
      const ids = dentistFilter.length > 0 ? dentistFilter : [NULL_UUID]
      apptsQuery = apptsQuery.in("dentist_id", ids)
      sessionsQuery = sessionsQuery.in("dentist_id", ids)
    }

    const [apptsRes, sessionsRes] = await Promise.all([
      apptsQuery.order("start_time", { ascending: false }),
      sessionsQuery.order("created_at", { ascending: false }),
    ])

    return ok({
      patient: patientRes.data ?? null,
      appointments: apptsRes.data ?? [],
      sessions: sessionsRes.data ?? [],
      dentists: dentistsRes.data ?? [],
    })
  } catch {
    return err("Erro ao carregar dados do paciente")
  }
}

export async function getPatientHistoryData(pacienteId: string) {
  try {
    const { supabase } = await requireAuth()

    const dentistFilter = await getUserDentistFilter()

    const { data: patient } = await supabase
      .from("patients")
      .select("id, name, cpf, email, phone, birth_date, active")
      .eq("id", pacienteId)
      .single()

    let apptQuery = supabase
      .from("appointments")
      .select("id, patient_id, dentist_id, procedure_id, start_time, end_time, status, notes, created_at, updated_at, dentists(name), procedures(name, color)")
      .eq("patient_id", pacienteId)
      .lte("start_time", new Date().toISOString())
      .order("start_time", { ascending: false })

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        apptQuery = apptQuery.in("dentist_id", dentistFilter)
      } else {
        apptQuery = apptQuery.eq("dentist_id", NULL_UUID)
      }
    }

    const { data: appointments } = await apptQuery

    let anamQuery = supabase
      .from("anamnese_sessions")
      .select("id, title, appointment_id, dentist_id, patient_id, notes, fields, created_at, dentists(name), appointment:appointments!anamnese_sessions_appointment_id_fkey(start_time, dentists(name), procedures(name))")
      .eq("patient_id", pacienteId)
      .order("created_at", { ascending: false })

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        anamQuery = anamQuery.in("dentist_id", dentistFilter)
      } else {
        anamQuery = anamQuery.eq("dentist_id", NULL_UUID)
      }
    }

    const { data: anamneses } = await anamQuery

    return ok({ patient, appointments: appointments ?? [], anamneses: anamneses ?? [] })
  } catch {
    return err("Erro ao carregar histórico")
  }
}
