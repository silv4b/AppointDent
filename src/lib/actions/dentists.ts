"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getDentists() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("dentists")
    .select("*")
    .order("name")
  return data ?? []
}

export async function createDentist(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from("dentists").insert({
    name: formData.get("name") as string,
    specialty: (formData.get("specialty") as string) || null,
    phone: (formData.get("phone") as string) || null,
    email: (formData.get("email") as string) || null,
  })

  if (error) return { error: error.message }
  revalidatePath("/dentistas")
}

export async function updateDentist(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase
    .from("dentists")
    .update({
      name: formData.get("name") as string,
      specialty: (formData.get("specialty") as string) || null,
      phone: (formData.get("phone") as string) || null,
      email: (formData.get("email") as string) || null,
      active: formData.get("active") === "true",
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/dentistas")
}

export async function deleteDentist(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase.from("dentists").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/dentistas")
}
