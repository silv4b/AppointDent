"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { saveAnamneseSession } from "@/lib/actions/anamnese"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database"
import { format } from "date-fns"
import { BookOpen, FileText, Loader2, Plus, Stethoscope } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { name: string } | null
  dentists: { name: string } | null
  procedures: { name: string; color: string | null; duration_minutes: number } | null
}

type AnamneseSession = Database["public"]["Tables"]["anamnese_sessions"]["Row"] & {
  appointments: { patients: { name: string } | null; dentists: { name: string } | null } | null
}

export function PacienteAnamneseClient({ pacienteId }: { pacienteId: string }) {
  const [patient, setPatient] = useState<{ id: string; name: string; phone: string | null; birth_date: string | null; notes: string | null } | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [sessions, setSessions] = useState<AnamneseSession[]>([])
  const [loading, setLoading] = useState(true)
  const [sessionOpen, setSessionOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<string>("")
  const [sessionNotes, setSessionNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()

    const [patientRes, apptsRes, sessionsRes] = await Promise.all([
      supabase.from("patients").select("*").eq("id", pacienteId).single(),
      supabase
        .from("appointments")
        .select("*, patients(name), dentists(name), procedures(name, color, duration_minutes)")
        .eq("patient_id", pacienteId)
        .order("start_time", { ascending: false }),
      supabase
        .from("anamnese_sessions")
        .select("*, appointments!inner(patients(name), dentists(name))")
        .eq("patient_id", pacienteId)
        .order("created_at", { ascending: false }),
    ])

    setPatient(patientRes.data ?? null)
    setAppointments(apptsRes.data ?? [])
    setSessions(sessionsRes.data as AnamneseSession[] ?? [])
    setLoading(false)
  }, [pacienteId])

  useEffect(() => { fetch() }, [fetch])

  const handleSaveSession = async () => {
    if (!selectedAppointment) {
      toast.error("Selecione um agendamento")
      return
    }
    setSaving(true)
    const formData = new FormData()
    formData.set("appointment_id", selectedAppointment)
    formData.set("notes", sessionNotes)
    const result = await saveAnamneseSession(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Sessão salva com sucesso")
      setSessionOpen(false)
      setSelectedAppointment("")
      setSessionNotes("")
      fetch()
    }
    setSaving(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Stethoscope className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Paciente não encontrado</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{patient.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {patient.phone && <span className="mr-4">Tel: {patient.phone}</span>}
            {patient.birth_date && <span>Nasc: {patient.birth_date}</span>}
          </p>
        </div>
        <Button onClick={() => setSessionOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Sessão
        </Button>
      </div>

      {appointments.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Atendimentos ({appointments.length})
          </h2>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dentista</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.dentists?.name ?? "-"}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Sessões de Anamnese ({sessions.length})
          </h2>
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{s.appointments?.dentists?.name ?? "Dentista"}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(s.created_at), "dd/MM/yyyy HH:mm")}
                  </span>
                </div>
                {s.notes ? (
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{s.notes}</p>
                ) : (
                  <p className="text-sm italic text-muted-foreground/60">Nenhuma anotação</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {appointments.length === 0 && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Nenhum registro encontrado</p>
          <p className="text-sm text-muted-foreground">Este paciente ainda não possui atendimentos ou sessões de anamnese.</p>
        </div>
      )}

      <Dialog open={sessionOpen} onOpenChange={setSessionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Sessão de Anamnese</DialogTitle>
            <DialogDescription>
              Adicione anotações sobre a sessão do paciente {patient.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Agendamento Relacionado</Label>
              <select
                className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedAppointment}
                onChange={(e) => setSelectedAppointment(e.target.value)}
              >
                <option value="">Selecione um agendamento...</option>
                {appointments.map((a) => (
                  <option key={a.id} value={a.id}>
                    {format(new Date(a.start_time), "dd/MM/yyyy HH:mm")} - {a.dentists?.name} - {a.procedures?.name ?? "Sem procedimento"}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Anotações</Label>
              <Textarea
                className="mt-1"
                placeholder="Descreva as observações da sessão..."
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSessionOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSession} disabled={saving || !selectedAppointment}>
              {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
