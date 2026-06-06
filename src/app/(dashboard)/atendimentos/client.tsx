"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { getTodayAtendimentos } from "@/lib/actions/queries"
import { startAppointment } from "@/lib/actions/appointments"
import { getUserSessionData } from "@/lib/actions/session"
import { Database } from "@/types/database"
import { format } from "date-fns"
import { Calendar, Clock, Loader2, Play, Search, X } from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { name: string } | null
  procedures: { name: string; color: string | null; duration_minutes: number } | null
}

type Tab = "future" | "current" | "past"

const TAB_LABEL: Record<Tab, string> = {
  future: "Próximos",
  current: "Em Andamento",
  past: "Passados",
}

const STATUS_OPTIONS = [
  { value: "scheduled", label: "Agendado" },
  { value: "confirmed", label: "Confirmado" },
  { value: "in_progress", label: "Em Andamento" },
  { value: "completed", label: "Concluído" },
  { value: "cancelled", label: "Cancelado" },
]

const statusLabel: Record<string, string> = {
  scheduled: "Agendado",
  confirmed: "Confirmado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
}

const statusVariant: Record<string, string> = {
  pending: "bg-purple-100 text-purple-800",
  scheduled: "bg-amber-100 text-amber-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
}

export function AtendimentosClient() {
  const router = useRouter()
  const [dentistId, setDentistId] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>("future")
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)

  const [patientSearch, setPatientSearch] = useState("")
  const [procedureSearch, setProcedureSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const fetch = useCallback(
    async (t?: Tab, p?: number, ps?: number) => {
      const activeTab = t ?? tab
      const pageNum = p ?? page
      const pageSizeNum = ps ?? pageSize

      setLoading(true)

      const result = await getTodayAtendimentos({
        tab: activeTab,
        page: pageNum,
        pageSize: pageSizeNum,
        patientSearch: patientSearch || undefined,
        procedureSearch: procedureSearch || undefined,
        statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      })

      if ("data" in result) {
        setAppointments(result.data.data as unknown as Appointment[])
        setTotal(result.data.total)
      } else {
        setAppointments([])
        setTotal(0)
      }
      setLoading(false)
    },
    [tab, page, pageSize, patientSearch, procedureSearch, statusFilter],
  )

  useEffect(() => {
    getUserSessionData().then((result) => {
      if ("data" in result && result.data.dentistId) {
        setDentistId(result.data.dentistId)
      } else {
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    setPage(1)
    if (dentistId) {
      setLoading(true)
      ;(async () => {
        const result = await getTodayAtendimentos({
          tab,
          page: 1,
          pageSize,
          patientSearch: patientSearch || undefined,
          procedureSearch: procedureSearch || undefined,
          statusFilter: statusFilter !== "all" ? statusFilter : undefined,
        })
        if ("data" in result) {
          setAppointments(result.data.data as unknown as Appointment[])
          setTotal(result.data.total)
        } else {
          setAppointments([])
          setTotal(0)
        }
        setLoading(false)
      })()
    }
  }, [tab, patientSearch, procedureSearch, statusFilter, dentistId, pageSize])

  useEffect(() => {
    setLoading(true)
    ;(async () => {
      const result = await getTodayAtendimentos({
        tab,
        page,
        pageSize,
        patientSearch: patientSearch || undefined,
        procedureSearch: procedureSearch || undefined,
        statusFilter: statusFilter !== "all" ? statusFilter : undefined,
      })
      if ("data" in result) {
        setAppointments(result.data.data as unknown as Appointment[])
        setTotal(result.data.total)
      } else {
        setAppointments([])
        setTotal(0)
      }
      setLoading(false)
    })()
  }, [page, pageSize])

  const handleTabChange = (newTab: Tab) => {
    if (newTab !== tab) {
      setTab(newTab)
      setPage(1)
    }
  }

  const handleStartAppointment = async (appointmentId: string, patientId: string) => {
    const form = new FormData()
    form.set("id", appointmentId)
    const result = await startAppointment(form)
    if (result?.error) {
      toast.error(result.error)
      return
    }
    toast.success("Atendimento iniciado")
    router.push(`/anamnese/${patientId}?appointmentId=${appointmentId}`)
  }

  if (!dentistId && !loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <Calendar className="h-12 w-12 text-muted-foreground" />
        <p className="text-lg font-medium">Perfil de dentista não encontrado</p>
        <p className="text-sm text-muted-foreground">Seu usuário não está vinculado a um dentista.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Atendimentos do Dia</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Gerencie os atendimentos de hoje.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4">
        <div className="flex-1 min-w-45">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Paciente</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar paciente..."
              value={patientSearch}
              onChange={(e) => { setPatientSearch(e.target.value); setPage(1) }}
              className="pl-8 h-9"
            />
            {patientSearch && (
              <button
                onClick={() => setPatientSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 min-w-45">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Procedimento</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar procedimento..."
              value={procedureSearch}
              onChange={(e) => { setProcedureSearch(e.target.value); setPage(1) }}
              className="pl-8 h-9"
            />
            {procedureSearch && (
              <button
                onClick={() => setProcedureSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <div className="w-45">
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Situação</label>
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v ?? "all"); setPage(1) }}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Todos">
                {statusFilter === "all" ? "Todos" : STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label ?? statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 flex gap-1 rounded-lg border bg-muted/20 p-1 w-fit">
        {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
          <Button
            key={t}
            variant={tab === t ? "default" : "ghost"}
            size="sm"
            onClick={() => handleTabChange(t)}
            className="px-4"
          >
            {TAB_LABEL[t]}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          {tab === "current" ? (
            <Clock className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Calendar className="h-12 w-12 text-muted-foreground" />
          )}
          <p className="mt-4 text-lg font-medium">
            {tab === "future" && "Nenhum atendimento futuro hoje"}
            {tab === "current" && "Nenhum atendimento em andamento"}
            {tab === "past" && "Nenhum atendimento passado hoje"}
          </p>
        </div>
      ) : (
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            {tab === "future" && <Calendar className="h-4 w-4 text-muted-foreground" />}
            {tab === "current" && <Clock className="h-4 w-4 text-muted-foreground" />}
            {tab === "past" && <Clock className="h-4 w-4 text-muted-foreground" />}
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {TAB_LABEL[tab]}
            </h2>
            <span className="text-xs text-muted-foreground">({total})</span>
          </div>
          <div className="rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Horário</TableHead>
                  {tab === "current" && <TableHead>Iniciado em</TableHead>}
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((a) => (
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
                    <TableCell>
                      {format(new Date(a.start_time), "HH:mm")} - {format(new Date(a.end_time), "HH:mm")}
                    </TableCell>
                    {tab === "current" && (
                      <TableCell className="text-sm text-muted-foreground">
                        {a.started_at ? format(new Date(a.started_at), "HH:mm") : "-"}
                      </TableCell>
                    )}
                    <TableCell>
                      <span className={`inline-flex items-center justify-center rounded-md border border-transparent px-2 py-0.5 text-[11px] font-medium capitalize min-w-[7.5rem] ${statusVariant[a.status] ?? "bg-muted text-muted-foreground"}`}>
                        {statusLabel[a.status] ?? a.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {(a.status === "scheduled" || a.status === "confirmed") && (
                          <Button
                            variant="default"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleStartAppointment(a.id, a.patient_id)}
                          >
                            <Play className="h-3.5 w-3.5" />
                            Iniciar
                          </Button>
                        )}
                        {a.status === "in_progress" && (
                          <Link
                            href={`/anamnese/${a.patient_id}?appointmentId=${a.id}`}
                            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                          >
                            Anamnese
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={(p) => { setPage(p) }}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
