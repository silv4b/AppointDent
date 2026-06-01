"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { format } from "date-fns"
import { isSameDay, startOfDay } from "date-fns"
import { CalendarDays, Check, PanelLeftClose, PanelLeftOpen, Search, X } from "lucide-react"
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
import { MiniCalendar } from "@/components/mini-calendar"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { getPendingAppointments, confirmAppointment, rejectAppointment } from "@/lib/actions/appointments"
import { createClient } from "@/lib/supabase/client"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Database } from "@/types/database"

type Appointment = Database["public"]["Tables"]["appointments"]["Row"] & {
  patients: { name: string } | null
  dentists: { name: string } | null
  procedures: { name: string; color: string | null; duration_minutes: number } | null
}

export function ConfirmacaoClient() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [dentists, setDentists] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filterDentist, setFilterDentist] = useState("all")
  const [filterDate, setFilterDate] = useState<Date | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [confirmTarget, setConfirmTarget] = useState<Appointment | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Appointment | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("confirmacao:sidebarCollapsed", false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [currentDentistId, setCurrentDentistId] = useState<string | null>(null)
  const [receptionistDentistIds, setReceptionistDentistIds] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from("profiles").select("role").eq("id", user.id).single().then(({ data: profile }) => {
        if (!profile) return
        setUserRole(profile.role)
        if (profile.role === "dentist") {
          supabase.from("dentists").select("id").eq("profile_id", user.id).single().then(({ data: dent }) => {
            if (dent) {
              setCurrentDentistId(dent.id)
              setFilterDentist(dent.id)
            }
          })
        } else if (profile.role === "receptionist") {
          supabase.from("receptionist_dentists").select("dentist_id").eq("receptionist_id", user.id).then(({ data }) => {
            const ids = data?.map((r) => r.dentist_id) ?? []
            setReceptionistDentistIds(ids)
          })
        }
      })
    })
  }, [supabase])

  const fetchPending = useCallback(async () => {
    setLoading(true)
    const [data, dentistsData] = await Promise.all([
      getPendingAppointments(),
      supabase.from("dentists").select("id, name").eq("active", true).order("name").then((r) => r.data ?? []),
    ])
    setAppointments(data)
    setDentists(dentistsData)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  useEffect(() => {
    const channel = supabase
      .channel("confirmacao-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        fetchPending()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchPending])

  const filtered = useMemo(() => {
    let list = appointments
    if (userRole === "receptionist" && receptionistDentistIds.length > 0) {
      list = list.filter((a) => receptionistDentistIds.includes(a.dentist_id))
    }
    if (filterDate) {
      list = list.filter((a) => isSameDay(startOfDay(new Date(a.start_time)), filterDate))
    }
    if (filterDentist !== "all") {
      list = list.filter((a) => a.dentist_id === filterDentist)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(
        (a) =>
          a.patients?.name?.toLowerCase().includes(q) ||
          a.dentists?.name?.toLowerCase().includes(q) ||
          a.procedures?.name?.toLowerCase().includes(q),
      )
    }
    return list
  }, [appointments, filterDate, filterDentist, search, userRole, receptionistDentistIds])

  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, page, pageSize])

  useEffect(() => {
    setPage(1)
  }, [search, filterDate, filterDentist])

  const handleConfirm = async () => {
    if (!confirmTarget) return
    setConfirming(true)
    const result = await confirmAppointment(confirmTarget.id)
    setConfirming(false)
    setConfirmTarget(null)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Agendamento confirmado com sucesso!")
      fetchPending()
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setRejecting(true)
    const result = await rejectAppointment(rejectTarget.id)
    setRejecting(false)
    setRejectTarget(null)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Agendamento cancelado.")
      fetchPending()
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Confirmação de Agendamentos</h1>
        <p className="mt-1 text-muted-foreground">
          {appointments.length > 0
            ? `Há ${appointments.length} agendamento${appointments.length > 1 ? "s" : ""} pendente${appointments.length > 1 ? "s" : ""} de confirmação.`
            : "Nenhum agendamento pendente."}
        </p>
      </div>

      <div className="flex gap-4">
        <div className="min-w-0 flex-1">
          <div className="rounded-lg border bg-card">
            <div className="flex flex-wrap items-end gap-3 border-b px-4 py-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por paciente, dentista ou procedimento..."
                  className="h-9 pl-9 pr-8"
                />
                {search && (
                  <button
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {userRole !== "dentist" && (
                <Select value={filterDentist} onValueChange={(v) => setFilterDentist(v ?? "all")} itemToStringLabel={(value) => value === "all" ? "Todos os dentistas" : dentists.find((d) => d.id === value)?.name ?? String(value)}>
                  <SelectTrigger className="h-9 w-[200px]">
                    <SelectValue placeholder="Todos os dentistas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os dentistas</SelectItem>
                    {dentists.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Dentista</TableHead>
                  <TableHead>Procedimento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Horário</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-52">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      {filterDate
                        ? "Nenhum agendamento pendente para esta data."
                        : "Nenhum agendamento pendente."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.patients?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.dentists?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{a.procedures?.name ?? "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(a.start_time), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(a.start_time), "HH:mm")} – {format(new Date(a.end_time), "HH:mm")}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md border border-transparent bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 min-w-[7.5rem] justify-center">
                          Pendente
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => setConfirmTarget(a)}
                          >
                            <Check className="h-3 w-3" />
                            Confirmar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setRejectTarget(a)}
                          >
                            <X className="h-3 w-3" />
                            Recusar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <DataTablePagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
            />
          </div>
        </div>

        <aside className={cn("hidden shrink-0 transition-all duration-300 md:block", sidebarCollapsed ? "w-12" : "w-72")}>
          {sidebarCollapsed ? (
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-card py-3">
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                onClick={() => setSidebarCollapsed(false)}
                title="Expandir sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
              <div className="h-px w-6 bg-border" />
              <button
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                onClick={() => setFilterDate(new Date())}
                title="Calendário"
              >
                <CalendarDays className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-lg border bg-card">
              <div className="flex items-center justify-between p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtrar por data</p>
                <div className="flex items-center gap-1">
                  {filterDate && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setFilterDate(null)}
                    >
                      Limpar
                    </button>
                  )}
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                    onClick={() => setSidebarCollapsed(true)}
                    title="Retrair sidebar"
                  >
                    <PanelLeftOpen className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <MiniCalendar
                currentDate={filterDate ?? new Date()}
                onSelect={(d) => setFilterDate(d)}
                appointments={userRole === "receptionist" && receptionistDentistIds.length > 0
                  ? appointments.filter((a) => receptionistDentistIds.includes(a.dentist_id))
                  : appointments}
              />
            </div>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={!!confirmTarget}
        onOpenChange={(open) => { if (!open) setConfirmTarget(null) }}
        title="Confirmar Agendamento"
        description={`Tem certeza que deseja confirmar o agendamento de ${confirmTarget?.patients?.name ?? "este paciente"}?`}
        confirmLabel="Confirmar"
        onConfirm={handleConfirm}
        loading={confirming}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(open) => { if (!open) setRejectTarget(null) }}
        title="Recusar Agendamento"
        description={`Tem certeza que deseja recusar o agendamento de ${rejectTarget?.patients?.name ?? "este paciente"}? O horário será liberado.`}
        confirmLabel="Recusar"
        onConfirm={handleReject}
        loading={rejecting}
      />
    </div>
  )
}
