import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SolicitacoesClient } from "./client"

export const metadata = { title: "Solicitações" }

export default async function SolicitacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  return <SolicitacoesClient />
}
