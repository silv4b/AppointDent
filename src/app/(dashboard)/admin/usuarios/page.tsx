import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UsuariosClient } from "./client"

export const metadata = { title: "Usuários" }

export default async function UsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  return <UsuariosClient />
}
