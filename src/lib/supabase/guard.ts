import { createClient } from "./server"

export class AuthError extends Error {
  constructor() {
    super("Usuário não autenticado")
    this.name = "AuthError"
  }
}

export async function requireAuth() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError()
  }

  return { supabase, user }
}
