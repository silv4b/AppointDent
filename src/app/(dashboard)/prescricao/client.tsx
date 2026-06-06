"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Eye, Pencil, Plus, Search, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DataTablePagination } from "@/components/data-table-pagination"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { getPrescriptions, deletePrescription } from "@/lib/actions/prescriptions"
import { getUserSessionData } from "@/lib/actions/session"

type PrescriptionRow = {
  id: string
  title: string
  created_at: string
  patients: { name: string } | null
  dentists: { name: string } | null
}

export function PrescricaoClient() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<PrescriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [deleteTarget, setDeleteTarget] = useState<PrescriptionRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    getUserSessionData().then((result) => {
      if ("data" in result) setUserRole(result.data.role)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await getPrescriptions(page, pageSize, search || undefined)
      if (cancelled) return
      if ("error" in result) {
        toast.error(result.error)
      } else if ("data" in result && result.data) {
        setPrescriptions(result.data.data as unknown as PrescriptionRow[])
        setTotal(result.data.total)
      }
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [page, pageSize, search])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search])

  const handleDelete = async () => {
    if (!deleteTarget) return
    const target = deleteTarget
    setDeleting(true)
    setDeleteTarget(null)
    setPrescriptions(prev => prev.filter(p => p.id !== target.id))
    const result = await deletePrescription(target.id)
    if (result?.error) {
      toast.error(result.error)
      ;(async () => {
        const r = await getPrescriptions(page, pageSize, search || undefined)
        if ("data" in r && r.data) {
          setPrescriptions(r.data.data as unknown as PrescriptionRow[])
          setTotal(r.data.total)
        }
      })()
    } else {
      toast.success("Receita excluída")
    }
    setDeleting(false)
  }

  const isReceptionist = userRole === "receptionist"

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Receituário</h1>
          <p className="mt-1 text-muted-foreground">Gerencie as receitas dos pacientes.</p>
        </div>
        {!isReceptionist && (
          <Button onClick={() => router.push("/prescricao/nova")}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Receita
          </Button>
        )}
      </div>

      <div className="rounded-lg border bg-card">
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por paciente ou título..."
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
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-left">Título</TableHead>
              <TableHead className="text-left">Paciente</TableHead>
              <TableHead className="text-left">Dentista</TableHead>
              <TableHead className="text-left">Data</TableHead>
              <TableHead className="w-40 text-left">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : prescriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  {search ? "Nenhuma receita encontrada." : "Nenhuma receita cadastrada."}
                </TableCell>
              </TableRow>
            ) : (
              prescriptions.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.title || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.patients?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{p.dentists?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(p.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => router.push(`/prescricao/${p.id}`)}
                        title="Ver receita"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {!isReceptionist && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => router.push(`/prescricao/${p.id}?edit=true`)}
                            title="Editar receita"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(p)}
                            title="Excluir receita"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
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
          total={total}
          onPageChange={setPage}
          onPageSizeChange={(s) => { setPageSize(s); setPage(1) }}
        />
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Excluir Receita"
        description={`Tem certeza que deseja excluir a receita "${deleteTarget?.title ?? ""}"?`}
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
