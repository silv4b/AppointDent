"use server"

import { createClient } from "@/lib/supabase/server"

export async function checkEmailRateLimit(
  email: string,
  action: "login" | "password_change",
  maxAttempts = 5,
  windowMinutes = 15,
): Promise<boolean> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc("check_rate_limit_by_email", {
    p_email: email,
    p_action: action,
    p_max_attempts: maxAttempts,
    p_window_minutes: windowMinutes,
  })
  if (error) {
    console.error("Rate limit check error:", error.message)
    return true
  }
  return data as boolean
}
