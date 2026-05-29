"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RichTextEditor } from "@/components/rich-text-editor"
import { createAnamnesisTemplate } from "@/lib/actions/anamnesis-templates"
import { Loader2, Plus, Trash2, GripVertical, ArrowLeft } from "lucide-react"
import { useRef, useState, useCallback } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"

export function NovoModeloClient() {
  const router = useRouter()
  const [templateName, setTemplateName] = useState("")
  const [templateFields, setTemplateFields] = useState<{ _id: number; label: string; description: string; defaultContent: string }[]>([{ _id: 0, label: "", description: "", defaultContent: "" }])
  const [saving, setSaving] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const fieldInputsRef = useRef<(HTMLInputElement | null)[]>([])
  const fieldIdCounter = useRef(1)

  const addField = () => {
    const id = fieldIdCounter.current++
    setTemplateFields([{ _id: id, label: "", description: "", defaultContent: "" }, ...templateFields])
    setTimeout(() => {
      fieldInputsRef.current[0]?.focus()
    }, 0)
  }
  const removeField = (i: number) => {
    if (templateFields.length <= 1) return
    setTemplateFields(templateFields.filter((_, j) => j !== i))
  }
  const updateField = (i: number, key: "label" | "description" | "defaultContent", v: string) => {
    const next = [...templateFields]
    next[i] = { ...next[i], [key]: v }
    setTemplateFields(next)
  }

  const handleCreate = async () => {
    if (!templateName.trim()) {
      toast.error("Informe um nome para o modelo")
      return
    }
    const validFields = templateFields.filter((f) => f.label.trim())
    if (validFields.length === 0) {
      toast.error("Adicione pelo menos um campo")
      return
    }

    setSaving(true)
    const form = new FormData()
    form.set("name", templateName.trim())
    form.set("fields", JSON.stringify(validFields.map((f) => ({ label: f.label.trim(), description: f.description.trim(), defaultContent: f.defaultContent }))))
    const result = await createAnamnesisTemplate(form)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Modelo criado")
      router.push("/minhas-anamneses")
    }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/minhas-anamneses" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Novo Modelo de Anamnese</h1>
        <p className="mt-1 text-muted-foreground">Defina os campos que farão parte deste modelo.</p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="template-name" className="text-base">Nome do Modelo</Label>
          <Input
            ref={nameRef}
            id="template-name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="Ex: Avaliação Inicial"
            className="mt-1.5"
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <Label className="text-base">Campos</Label>
            <Button type="button" variant="outline" size="sm" onClick={addField}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Adicionar Campo
            </Button>
          </div>
          <div className="space-y-4">
            {templateFields.map((field, i) => (
              <div key={field._id} className="rounded-xl border bg-card p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground/40" />
                    <span className="text-xs font-medium text-muted-foreground">Campo {templateFields.length - i}</span>
                  </div>
                  {templateFields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeField(i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Nome do campo</Label>
                    <Input
                      ref={(el) => { fieldInputsRef.current[i] = el }}
                      value={field.label}
                      onChange={(e) => updateField(i, "label", e.target.value)}
                      placeholder="Ex: Histórico Familiar"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Descrição (informativa)</Label>
                    <Input
                      value={field.description}
                      onChange={(e) => updateField(i, "description", e.target.value)}
                      placeholder="Ex: Perguntar sobre doenças hereditárias na família"
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Conteúdo padrão</Label>
                    <RichTextEditor
                      value={field.defaultContent}
                      onChange={(v) => updateField(i, "defaultContent", v)}
                      minHeight="100px"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button size="lg" onClick={handleCreate} disabled={saving || !templateName.trim()}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Criar Modelo
          </Button>
          <Button variant="outline" size="lg" onClick={() => router.push("/minhas-anamneses")} disabled={saving}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}
