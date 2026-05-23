"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getAvailabilitySlots() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("availability_slots")
    .select("*, dentists(name)")
    .order("day_of_week")
    .order("start_time")
  return data ?? []
}

export async function createAvailabilitySlot(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from("availability_slots").insert({
    dentist_id: formData.get("dentist_id") as string,
    day_of_week: Number(formData.get("day_of_week")),
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
  })

  if (error) return { error: error.message }
  revalidatePath("/horarios")
}

export async function updateAvailabilitySlot(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase
    .from("availability_slots")
    .update({
      dentist_id: formData.get("dentist_id") as string,
      day_of_week: Number(formData.get("day_of_week")),
      start_time: formData.get("start_time") as string,
      end_time: formData.get("end_time") as string,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/horarios")
}

export async function deleteAvailabilitySlot(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase.from("availability_slots").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/horarios")
}
