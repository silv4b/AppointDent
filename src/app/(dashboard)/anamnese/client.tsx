"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { createClient } from "@/lib/supabase/client"
import { Database } from "@/types/database"
import { Loader2, Search, UserRound, FileText } from "lucide-react"
import Link from "next/link"
import { useCallback, useRef, useState } from "react"

type Patient = Database["public"]["Tables"]["patients"]["Row"]

export function AnamneseSearchClient() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)

    const supabase = createClient()
    const { data } = await supabase
      .from("patients")
      .select("*")
      .ilike("name", `%${query.trim()}%`)
      .order("name")
      .limit(30)

    setResults(data ?? [])
    setLoading(false)
  }, [query])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Anamnese</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Busque pacientes para visualizar ou adicionar anotações de sessões.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Nome do Paciente</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              placeholder="Digite o nome do paciente..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch() }}
              className="pl-8"
            />
          </div>
        </div>

        <Button onClick={handleSearch} disabled={!query.trim() || loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Buscar
        </Button>
      </div>

      {searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <UserRound className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium">Nenhum paciente encontrado</p>
          <p className="text-sm text-muted-foreground">Tente alterar os termos da busca.</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Data de Nasc.</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.phone ?? "-"}</TableCell>
                  <TableCell>{p.birth_date ?? "-"}</TableCell>
                  <TableCell>
                    <Link
                      href={`/anamnese/${p.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Anamnese
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
