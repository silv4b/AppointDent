"use server"

import { requireAuth } from "@/lib/supabase/guard"
import { ok, err } from "@/lib/utils/action-response"

export type UserSession = {
  userId: string
  role: string | null
  dentistId: string | null
  dentistName: string | null
  receptionistDentistIds: string[]
}

export async function getUserSessionData() {
  try {
    const { supabase, user } = await requireAuth()

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role ?? null
    let dentistId: string | null = null
    let dentistName: string | null = null
    let receptionistDentistIds: string[] = []

    if (role === "dentist") {
      const { data: dent } = await supabase
        .from("dentists")
        .select("id, name")
        .eq("profile_id", user.id)
        .single()
      if (dent) {
        dentistId = dent.id
        dentistName = dent.name
      }
    } else if (role === "receptionist") {
      const { data: links } = await supabase
        .from("receptionist_dentists")
        .select("dentist_id")
        .eq("receptionist_id", user.id)
      receptionistDentistIds = links?.map((l) => l.dentist_id) ?? []
    }

    return ok({
      userId: user.id,
      role,
      dentistId,
      dentistName,
      receptionistDentistIds,
    })
  } catch (e) {
    if (e instanceof Error && e.name === "AuthError") return err("Não autenticado")
    return err("Erro ao carregar sessão")
  }
}
