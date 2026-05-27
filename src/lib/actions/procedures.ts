"use server"

import { requireAuth } from "@/lib/supabase/guard"
import { revalidatePath } from "next/cache"
import { procedureSchema } from "@/lib/schemas"
import { ok, err } from "@/lib/utils/action-response"
import { z } from "zod"

export async function getProcedures() {
  try {
    const { supabase } = await requireAuth()
    const { data } = await supabase.from("procedures").select("*").order("name")
    return data ?? []
  } catch {
    return []
  }
}

export async function createProcedure(formData: FormData) {
  const { supabase } = await requireAuth()

  const raw = Object.fromEntries(formData)
  const parsed = procedureSchema.safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { error } = await supabase.from("procedures").insert({
    name: parsed.data.name,
    description: parsed.data.description || null,
    duration_minutes: parsed.data.duration_minutes,
    price: parsed.data.price ?? null,
    color: parsed.data.color,
  })

  if (error) return err(error.message)
  revalidatePath("/procedimentos")
  return ok()
}

export async function updateProcedure(formData: FormData) {
  const { supabase } = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = procedureSchema.extend({ id: z.string().uuid() }).safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { id, ...fields } = parsed.data

  const { error } = await supabase
    .from("procedures")
    .update({
      name: fields.name,
      description: fields.description || null,
      duration_minutes: fields.duration_minutes,
      price: fields.price ?? null,
      color: fields.color,
      active: fields.active ?? true,
    })
    .eq("id", id)

  if (error) return err(error.message)
  revalidatePath("/procedimentos")
  return ok()
}

export async function deleteProcedure(formData: FormData) {
  const { supabase } = await requireAuth()
  const raw = Object.fromEntries(formData)
  const parsed = z.object({ id: z.string().uuid() }).safeParse(raw)
  if (!parsed.success) return err(parsed.error.issues.map((e) => e.message).join(", "))

  const { error } = await supabase.from("procedures").delete().eq("id", parsed.data.id)
  if (error) return err(error.message)
  revalidatePath("/procedimentos")
  return ok()
}
