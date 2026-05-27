"use server"

import { requireAuth, AuthError } from "@/lib/supabase/guard"
import { revalidatePath } from "next/cache"
import { format } from "date-fns"
import { appointmentSchema, appointmentUpdateSchema } from "@/lib/schemas"
import { ok, err } from "@/lib/utils/action-response"
import { z } from "zod"

export async function getAppointments(date: string) {
  try {
    const { supabase } = await requireAuth()
    const dayStart = `${date}T00:00:00Z`
    const dayEnd = `${date}T23:59:59Z`

    const { data } = await supabase
      .from("appointments")
      .select("*, patients(name), dentists(name), procedures(name, color, duration_minutes)")
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)
      .order("start_time")

    return data ?? []
  } catch {
    return []
  }
}

export async function getAppointmentsRange(start: string, end: string) {
  try {
    const { supabase } = await requireAuth()

    const { data } = await supabase
      .from("appointments")
      .select("*, patients(name), dentists(name), procedures(name, color, duration_minutes)")
      .gte("start_time", start)
      .lte("start_time", end)
      .order("start_time")

    return data ?? []
  } catch {
    return []
  }
}

async function checkOverlap(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/guard").requireAuth>>["supabase"],
  dentistId: string,
  startTime: string,
  endTime: string,
  excludeId?: string,
) {
  let query = supabase
    .from("appointments")
    .select("id, start_time, end_time, patients!inner(name), dentists!inner(name)")
    .eq("dentist_id", dentistId)
    .lt("start_time", endTime)
    .gt("end_time", startTime)

  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data } = await query

  if (data && data.length > 0) {
    const conflict = data[0]
    const patientName = conflict.patients?.name
    const dentistName = conflict.dentists?.name
    return `Conflito de horário: ${dentistName} já possui atendimento com ${patientName} das ${format(new Date(conflict.start_time), "HH:mm")} às ${format(new Date(conflict.end_time), "HH:mm")}`
  }

  return null
}

export async function createAppointment(formData: FormData) {
  const { supabase } = await requireAuth()

  const raw = Object.fromEntries(formData)
  const parsed = appointmentSchema.safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { patient_id, dentist_id, procedure_id, start_time: startTimeLocal, end_time: endTimeLocal, notes } = parsed.data

  const startTime = new Date(startTimeLocal).toISOString()
  let endTime: string

  if (endTimeLocal) {
    endTime = new Date(endTimeLocal).toISOString()
  } else if (procedure_id) {
    const { data: procedure } = await supabase
      .from("procedures")
      .select("duration_minutes")
      .eq("id", procedure_id)
      .single()

    if (procedure) {
      const start = new Date(startTimeLocal)
      endTime = new Date(start.getTime() + procedure.duration_minutes * 60000).toISOString()
    } else {
      endTime = startTime
    }
  } else {
    endTime = startTime
  }

  const conflict = await checkOverlap(supabase, dentist_id, startTime, endTime)
  if (conflict) return err(conflict)

  const { error } = await supabase.from("appointments").insert({
    patient_id,
    dentist_id,
    procedure_id: procedure_id || null,
    start_time: startTime,
    end_time: endTime,
    notes: notes || null,
    status: "scheduled",
  })

  if (error) return err(error.message)
  revalidatePath("/agenda")
  return ok()
}

export async function updateAppointment(formData: FormData) {
  const { supabase } = await requireAuth()

  const raw = Object.fromEntries(formData)
  const parsed = appointmentUpdateSchema.safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { id, patient_id, dentist_id, procedure_id, start_time: startTimeLocal, end_time: endTimeLocal, notes, status } = parsed.data

  const startTime = new Date(startTimeLocal).toISOString()
  const endTime = endTimeLocal ? new Date(endTimeLocal).toISOString() : startTime

  const conflict = await checkOverlap(supabase, dentist_id, startTime, endTime, id)
  if (conflict) return err(conflict)

  const { error } = await supabase
    .from("appointments")
    .update({
      patient_id,
      dentist_id,
      procedure_id: procedure_id || null,
      start_time: startTime,
      end_time: endTime,
      notes: notes || null,
      status: status || "scheduled",
    })
    .eq("id", id)

  if (error) return err(error.message)
  revalidatePath("/agenda")
  return ok()
}

export async function updateAppointmentStatus(formData: FormData) {
  const { supabase } = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = z.object({ id: z.string().uuid(), status: z.string().min(1) }).safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { error } = await supabase.from("appointments").update({ status: parsed.data.status }).eq("id", parsed.data.id)
  if (error) return err(error.message)
  revalidatePath("/agenda")
  return ok()
}

export async function deleteAppointment(formData: FormData) {
  const { supabase } = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = z.object({ id: z.string().uuid() }).safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { error } = await supabase.from("appointments").delete().eq("id", parsed.data.id)
  if (error) return err(error.message)
  revalidatePath("/agenda")
  return ok()
}
