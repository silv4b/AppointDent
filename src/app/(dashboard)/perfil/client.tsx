"use client"

import { useSupabase } from "@/components/providers/supabase-provider"
import { createClient } from "@/lib/supabase/client"
import { Loader2, User, Mail, BadgeInfo } from "lucide-react"
import { useEffect, useState } from "react"

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  receptionist: "Secretária",
}

export function PerfilClient() {
  const { user } = useSupabase()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const supabase = createClient()
    supabase.from("profiles").select("role").eq("id", user.id).single()
      .then(({ data: profile }) => {
        if (profile) setRole(profile.role)
        setLoading(false)
      })
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const name = user?.user_metadata?.name as string | undefined
  const email = user?.email ?? "—"

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Meu Perfil</h1>
        <p className="mt-1 text-muted-foreground">Informações da sua conta</p>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex flex-col items-center gap-4 border-b px-6 py-10">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
            {name
              ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              : email[0].toUpperCase()}
          </div>
          <div className="text-center">
            <h2 className="text-xl font-semibold">{name ?? "Usuário"}</h2>
            <p className="text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="divide-y px-6">
          <div className="flex items-center gap-4 py-4">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Nome</p>
              <p className="text-sm font-medium">{name ?? "—"}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-4">
            <BadgeInfo className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Função</p>
              <p className="text-sm font-medium">{ROLE_LABEL[role ?? ""] ?? role ?? "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {(role === "admin") && (
        <div className="mt-8 rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">Atalhos</h2>
          </div>
          <div className="p-4">
            <p className="text-sm text-muted-foreground">
              Gerencie as solicitações de procedimentos na página de{" "}
              <a href="/admin/solicitacoes" className="text-primary underline underline-offset-4 hover:text-primary/80">
                Solicitações
              </a>.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
