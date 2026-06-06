"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { format } from "date-fns"
import { isSameDay, startOfDay } from "date-fns"
import { CalendarDays, Check, Copy, Eye, MessageCircle, PanelLeftClose, PanelLeftOpen, Search, X, Loader2 } from "lucide-react"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getPendingAppointments, confirmAppointment, rejectAppointment, getPatientDetailsById } from "@/lib/actions/appointments"
import { createClient } from "@/lib/supabase/client"
import { getUserSessionData } from "@/lib/actions/session"
import { getDentistsSimpleList } from "@/lib/actions/queries"
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
  const [patientDetails, setPatientDetails] = useState<Database["public"]["Tables"]["patients"]["Row"] | null>(null)
  const [patientDetailsOpen, setPatientDetailsOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("confirmacao:sidebarCollapsed", false)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [, setCurrentDentistId] = useState<string | null>(null)
  const [receptionistDentistIds, setReceptionistDentistIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkLoading, setBulkLoading] = useState(false)
  const bulkLoadingRef = useRef(false)

  useEffect(() => {
    getUserSessionData().then((result) => {
      if (!("data" in result)) return
      const { role, dentistId, receptionistDentistIds } = result.data
      setUserRole(role)
      if (role === "dentist" && dentistId) {
        setCurrentDentistId(dentistId)
        setFilterDentist(dentistId)
      } else if (role === "receptionist") {
        setReceptionistDentistIds(receptionistDentistIds)
      }
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const [pendingRes, dentistsResult] = await Promise.all([
        getPendingAppointments(),
        getDentistsSimpleList(),
      ])
      if (cancelled) return
      if ("error" in pendingRes) {
        toast.error(pendingRes.error!)
      } else {
        setAppointments(pendingRes.data ?? [])
      }
      setDentists(("data" in dentistsResult) ? dentistsResult.data : [])
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("confirmacao-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        ;(async () => {
          const res = await getPendingAppointments()
          if ("data" in res) setAppointments(res.data ?? [])
        })()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search, filterDate, filterDentist])

  const handleConfirm = async () => {
    if (!confirmTarget) return
    const target = confirmTarget
    setConfirming(true)
    setConfirmTarget(null)
    setAppointments(prev => prev.filter(a => a.id !== target.id))
    const result = await confirmAppointment(target.id)
    setConfirming(false)
    if (result?.error) {
      toast.error(result.error)
      ;(async () => { const res = await getPendingAppointments(); if ("data" in res) setAppointments(res.data ?? []) })()
    } else {
      toast.success("Agendamento confirmado com sucesso!")
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    const target = rejectTarget
    setRejecting(true)
    setRejectTarget(null)
    setAppointments(prev => prev.filter(a => a.id !== target.id))
    const result = await rejectAppointment(target.id)
    setRejecting(false)
    if (result?.error) {
      toast.error(result.error)
      ;(async () => { const res = await getPendingAppointments(); if ("data" in res) setAppointments(res.data ?? []) })()
    } else {
      toast.success("Agendamento cancelado.")
    }
  }

  const handleViewPatient = async (appointment: Appointment) => {
    const result = await getPatientDetailsById(appointment.patient_id)
    if ("data" in result && result.data) {
      setPatientDetails(result.data as Database["public"]["Tables"]["patients"]["Row"])
      setPatientDetailsOpen(true)
    }
  }

  const selectedCount = selectedIds.length
  const isAllSelected = paginated.length > 0 && paginated.every(a => selectedIds.includes(a.id))

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !paginated.some(a => a.id === id)))
    } else {
      const ids = new Set(selectedIds)
      paginated.forEach(a => ids.add(a.id))
      setSelectedIds([...ids])
    }
  }

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const handleBulkConfirm = async () => {
    if (bulkLoadingRef.current || selectedCount === 0) return
    bulkLoadingRef.current = true
    setBulkLoading(true)
    const ids = [...selectedIds]
    setSelectedIds([])
    setAppointments(prev => prev.filter(a => !ids.includes(a.id)))
    const results = await Promise.all(ids.map(id => confirmAppointment(id)))
    const errors = results.filter(r => r?.error)
    if (errors.length > 0) {
      toast.error(`${errors.length} de ${ids.length} agendamento(s) não confirmados.`)
      ;(async () => { const res = await getPendingAppointments(); if ("data" in res) setAppointments(res.data ?? []) })()
    } else {
      toast.success(`${ids.length} agendamento(s) confirmado(s)!`)
    }
    bulkLoadingRef.current = false
    setBulkLoading(false)
  }

  const handleBulkReject = async () => {
    if (bulkLoadingRef.current || selectedCount === 0) return
    bulkLoadingRef.current = true
    setBulkLoading(true)
    const ids = [...selectedIds]
    setSelectedIds([])
    setAppointments(prev => prev.filter(a => !ids.includes(a.id)))
    const results = await Promise.all(ids.map(id => rejectAppointment(id)))
    const errors = results.filter(r => r?.error)
    if (errors.length > 0) {
      toast.error(`${errors.length} de ${ids.length} agendamento(s) não recusados.`)
      ;(async () => { const res = await getPendingAppointments(); if ("data" in res) setAppointments(res.data ?? []) })()
    } else {
      toast.success(`${ids.length} agendamento(s) recusado(s)!`)
    }
    bulkLoadingRef.current = false
    setBulkLoading(false)
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

      <div className="flex gap-6">
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

            {selectedCount > 0 && (
              <div className="flex items-center gap-2 border-b px-4 py-2">
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selecionado{selectedCount > 1 ? "s" : ""}
                </span>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                    onClick={handleBulkConfirm}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                    Confirmar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleBulkReject}
                    disabled={bulkLoading}
                  >
                    {bulkLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    Recusar
                  </Button>
                </div>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary cursor-pointer"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      disabled={paginated.length === 0}
                    />
                  </TableHead>
                  <TableHead className="text-left">Paciente</TableHead>
                  <TableHead className="text-left">Dentista</TableHead>
                  <TableHead className="text-left">Procedimento</TableHead>
                  <TableHead className="text-left">Data</TableHead>
                  <TableHead className="text-left">Horário</TableHead>
                  <TableHead className="text-left">Situação</TableHead>
                  <TableHead className="w-52 text-left">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      {filterDate
                        ? "Nenhum agendamento pendente para esta data."
                        : "Nenhum agendamento pendente."}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((a) => (
                    <TableRow key={a.id} className={selectedIds.includes(a.id) ? "bg-muted/30" : ""}>
                      <TableCell>
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary cursor-pointer"
                          checked={selectedIds.includes(a.id)}
                          onChange={() => handleSelectOne(a.id)}
                        />
                      </TableCell>
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
                        <span className="inline-flex items-center rounded-md border border-transparent bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                          Pendente
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => setConfirmTarget(a)}
                            title="Confirmar"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => setRejectTarget(a)}
                            title="Recusar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleViewPatient(a)}
                            title="Ver dados do paciente"
                          >
                            <Eye className="h-3.5 w-3.5" />
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

      <Dialog open={patientDetailsOpen} onOpenChange={setPatientDetailsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dados do Paciente</DialogTitle>
            <DialogDescription>
              Informações de contato e dados cadastrais.
            </DialogDescription>
          </DialogHeader>
          {patientDetails && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-2">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{patientDetails.name}</span>
                <span className="text-muted-foreground">CPF</span>
                <span>{patientDetails.cpf ?? "—"}</span>
                <span className="text-muted-foreground">Telefone</span>
                <span className="flex items-center gap-1.5">
                  {patientDetails.phone ?? "—"}
                  {patientDetails.phone && (
                    <>
                      <a
                        href={`https://wa.me/${patientDetails.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600 hover:text-green-700" />
                      </a>
                      <button
                        onClick={() => { navigator.clipboard.writeText(patientDetails.phone!); toast.success("Telefone copiado") }}
                        title="Copiar telefone"
                      >
                        <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </button>
                    </>
                  )}
                </span>
                <span className="text-muted-foreground">E-mail</span>
                <span className="flex items-center gap-1.5">
                  {patientDetails.email ?? "—"}
                  {patientDetails.email && (
                    <button
                      onClick={() => { navigator.clipboard.writeText(patientDetails.email!); toast.success("E-mail copiado") }}
                      title="Copiar e-mail"
                    >
                      <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </button>
                  )}
                </span>
                <span className="text-muted-foreground">Nascimento</span>
                <span>{patientDetails.birth_date ? format(new Date(patientDetails.birth_date), "dd/MM/yyyy") : "—"}</span>
                <span className="text-muted-foreground">Observações</span>
                <span>{patientDetails.notes ?? "—"}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
