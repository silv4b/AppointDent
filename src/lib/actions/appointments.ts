"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAppointments(date: string) {
  const supabase = await createClient()
  const dayStart = `${date}T00:00:00Z`
  const dayEnd = `${date}T23:59:59Z`

  const { data } = await supabase
    .from("appointments")
    .select("*, patients(name), dentists(name), procedures(name, color, duration_minutes)")
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd)
    .order("start_time")

  return data ?? []
}

export async function createAppointment(formData: FormData) {
  const supabase = await createClient()

  const startTime = formData.get("start_time") as string
  const procedureId = formData.get("procedure_id") as string | null

  let endTime = formData.get("end_time") as string | null

  if (!endTime && procedureId) {
    const { data: procedure } = await supabase
      .from("procedures")
      .select("duration_minutes")
      .eq("id", procedureId)
      .single()

    if (procedure) {
      const start = new Date(startTime)
      endTime = new Date(start.getTime() + procedure.duration_minutes * 60000).toISOString()
    }
  }

  const { error } = await supabase.from("appointments").insert({
    patient_id: formData.get("patient_id") as string,
    dentist_id: formData.get("dentist_id") as string,
    procedure_id: procedureId || null,
    start_time: startTime,
    end_time: endTime || startTime,
    notes: (formData.get("notes") as string) || null,
    status: "scheduled",
  })

  if (error) return { error: error.message }
  revalidatePath("/agenda")
}

export async function updateAppointment(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase
    .from("appointments")
    .update({
      patient_id: formData.get("patient_id") as string,
      dentist_id: formData.get("dentist_id") as string,
      procedure_id: (formData.get("procedure_id") as string) || null,
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
      notes: (formData.get("notes") as string) || null,
      status: (formData.get("status") as string) || "scheduled",
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/agenda")
}

export async function updateAppointmentStatus(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase
    .from("appointments")
    .update({ status: formData.get("status") as string })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/agenda")
}

export async function deleteAppointment(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase.from("appointments").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/agenda")
}
