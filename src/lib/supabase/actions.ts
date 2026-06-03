"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { loginSchema, signupSchema } from "@/lib/schemas"
import { err } from "@/lib/utils/action-response"

export async function login(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = loginSchema.safeParse(raw)
  if (!parsed.success) {
    return err(parsed.error.issues.map((e) => e.message).join(", "))
  }

  const supabase = await createClient()

  const { data: allowed } = await supabase.rpc("check_login_rate_limit", {
    ip_address: "global",
  })

  if (allowed === false) {
    return err("Muitas tentativas de login. Tente novamente em 1 minuto.")
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) return err(error.message)

  revalidatePath("/", "layout")
  redirect("/")
}

export async function signup(formData: FormData) {
  const raw = Object.fromEntries(formData)
  const parsed = signupSchema.safeParse(raw)
  if (!parsed.success) {
    return err(parsed.error.issues.map((e) => e.message).join(", "))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  })

  if (error) return err(error.message)

  revalidatePath("/", "layout")
  redirect("/")
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/", "layout")
  redirect("/login")
}
