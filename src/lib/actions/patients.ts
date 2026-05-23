"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getPatients() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("patients")
    .select("*")
    .order("name")
  return data ?? []
}

export async function createPatient(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from("patients").insert({
    name: formData.get("name") as string,
    cpf: (formData.get("cpf") as string) || null,
    phone: (formData.get("phone") as string) || null,
    birth_date: (formData.get("birth_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/pacientes")
}

export async function updatePatient(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase
    .from("patients")
    .update({
      name: formData.get("name") as string,
      cpf: (formData.get("cpf") as string) || null,
      phone: (formData.get("phone") as string) || null,
      birth_date: (formData.get("birth_date") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/pacientes")
}

export async function deletePatient(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase.from("patients").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/pacientes")
}
