"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getMyDentistId, getMyAppointments } from "@/lib/actions/anamnese"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar, Clock, Loader2, Stethoscope } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { name: string } | null
  procedures: { name: string; color: string | null; duration_minutes: number } | null
}

export function MinhaAgendaClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dentistId, setDentistId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const { data: dentist } = await supabase
      .from("dentists")
      .select("id, name")
      .eq("profile_id", user.id)
      .single()

    if (!dentist) { setLoading(false); return }

    setDentistId(dentist.id)

    const { data } = await supabase
      .from("appointments")
      .select("*, patients(name), procedures(name, color, duration_minutes)")
      .eq("dentist_id", dentist.id)
      .order("start_time", { ascending: false })

    setAppointments(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const now = new Date()

  const past = appointments.filter((a) => new Date(a.end_time) < now)
  const current = appointments.filter((a) => {
    const start = new Date(a.start_time)
    const end = new Date(a.end_time)
    return start <= now && end >= now
  })
  const future = appointments.filter((a) => new Date(a.start_time) > now)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dentistId) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Stethoscope className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Perfil de dentista não encontrado</p>
        <p className="text-sm text-muted-foreground">Seu usuário não está vinculado a um dentista.</p>
      </div>
    )
  }

  const statusLabel: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    in_progress: "Em Andamento",
    completed: "Concluído",
    cancelled: "Cancelado",
  }

  const statusVariant: Record<string, string> = {
    scheduled: "bg-primary/10 text-primary",
    confirmed: "bg-chart-2/10 text-chart-2",
    in_progress: "bg-warning/10 text-warning-foreground",
    completed: "bg-success/10 text-success-foreground",
    cancelled: "bg-destructive/10 text-destructive",
  }

  function AppointmentSection({ title, items, icon: Icon }: { title: string; items: Appointment[]; icon: typeof Clock }) {
    if (items.length === 0) return null
    return (
      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{title}</h2>
          <span className="text-xs text-muted-foreground">({items.length})</span>
        </div>
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Procedimento</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.patients?.name ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {a.procedures?.color && (
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: a.procedures.color }} />
                      )}
                      <span className="text-sm text-muted-foreground">{a.procedures?.name ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(a.start_time), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    {format(new Date(a.start_time), "HH:mm")} - {format(new Date(a.end_time), "HH:mm")}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-[11px] font-medium capitalize shadow-sm ${statusVariant[a.status] ?? "bg-muted text-muted-foreground"}`}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/anamnese/${a.patient_id}`}
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      Anamnese
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Minha Agenda</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todos os seus agendamentos organizados por período.</p>
      </div>

      <AppointmentSection title="Acontecendo Agora" items={current} icon={Clock} />
      <AppointmentSection title="Futuros" items={future} icon={Calendar} />
      <AppointmentSection title="Passados" items={past} icon={Clock} />

      {appointments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Calendar className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Nenhum agendamento encontrado</p>
          <p className="text-sm text-muted-foreground">Você ainda não possui agendamentos.</p>
        </div>
      )}
    </div>
  )
}
