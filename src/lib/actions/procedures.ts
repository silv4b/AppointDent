"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getProcedures() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("procedures")
    .select("*")
    .order("name")
  return data ?? []
}

export async function createProcedure(formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase.from("procedures").insert({
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    duration_minutes: Number(formData.get("duration_minutes")),
    price: formData.get("price") ? Number(formData.get("price")) : null,
    color: (formData.get("color") as string) || "#3b82f6",
  })

  if (error) return { error: error.message }
  revalidatePath("/procedimentos")
}

export async function updateProcedure(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase
    .from("procedures")
    .update({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || null,
      duration_minutes: Number(formData.get("duration_minutes")),
      price: formData.get("price") ? Number(formData.get("price")) : null,
      color: (formData.get("color") as string) || "#3b82f6",
      active: formData.get("active") === "true",
    })
    .eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/procedimentos")
}

export async function deleteProcedure(formData: FormData) {
  const supabase = await createClient()
  const id = formData.get("id") as string

  const { error } = await supabase.from("procedures").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/procedimentos")
}
