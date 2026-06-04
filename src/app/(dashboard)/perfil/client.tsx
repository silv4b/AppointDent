"use client"

import { useSupabase } from "@/components/providers/supabase-provider"
import { createClient } from "@/lib/supabase/client"
import { useCallback, useEffect, useState, type ChangeEvent } from "react"
import { Building2, Loader2, Mail, User, BadgeInfo, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getClinicSettings, saveClinicSettings } from "@/lib/actions/clinic-settings"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { CropDialog } from "@/components/crop-dialog"
import type { Database } from "@/types/database"

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  dentist: "Dentista",
  receptionist: "Secretária",
}

type ClinicData = Database["public"]["Tables"]["clinic_settings"]["Row"]

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskCnpj(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function PerfilClient() {
  const { user } = useSupabase()
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const [clinic, setClinic] = useState<ClinicData | null>(null)
  const [clinicId, setClinicId] = useState("")
  const [clinicName, setClinicName] = useState("")
  const [clinicStreet, setClinicStreet] = useState("")
  const [clinicNumber, setClinicNumber] = useState("")
  const [clinicNeighborhood, setClinicNeighborhood] = useState("")
  const [clinicCity, setClinicCity] = useState("")
  const [clinicState, setClinicState] = useState("")
  const [clinicEmail, setClinicEmail] = useState("")
  const [clinicPhone1, setClinicPhone1] = useState("")
  const [clinicPhone2, setClinicPhone2] = useState("")
  const [clinicCnpj, setClinicCnpj] = useState("")
  const [clinicLogo, setClinicLogo] = useState<string | null>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false)
  const [savingClinic, setSavingClinic] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    supabase.from("profiles").select("role").eq("id", user.id).single()
      .then(({ data: profile }) => {
        if (profile) setRole(profile.role)
        setLoading(false)
      })
  }, [user, supabase])

  useEffect(() => {
    if (role !== "admin") return
    getClinicSettings().then((result) => {
      if ("data" in result && result.data) {
        const c = result.data as ClinicData
        setClinic(c)
        setClinicId(c.id)
        setClinicName(c.name)
        setClinicStreet(c.street)
        setClinicNumber(c.number)
        setClinicNeighborhood(c.neighborhood)
        setClinicCity(c.city)
        setClinicState(c.state)
        setClinicEmail(c.email)
        setClinicPhone1(c.phone1 ? maskPhone(c.phone1) : "")
        setClinicPhone2(c.phone2 ? maskPhone(c.phone2) : "")
        setClinicCnpj(c.cnpj ? maskCnpj(c.cnpj) : "")
        setClinicLogo(c.logo ?? null)
      }
    })
  }, [role])

  const handleSaveClinic = useCallback(async () => {
    setSavingClinic(true)
    const formData = new FormData()
    if (clinicId) formData.set("id", clinicId)
    formData.set("name", clinicName)
    formData.set("street", clinicStreet)
    formData.set("number", clinicNumber)
    formData.set("neighborhood", clinicNeighborhood)
    formData.set("city", clinicCity)
    formData.set("state", clinicState)
    formData.set("email", clinicEmail)
    formData.set("phone1", clinicPhone1)
    formData.set("phone2", clinicPhone2)
    formData.set("cnpj", clinicCnpj)
    formData.set("logo", clinicLogo ?? "")
    const result = await saveClinicSettings(formData)
    if (result?.error) {
      toast.error(result.error)
    } else {
      toast.success("Dados da clínica salvos!")
    }
    setSavingClinic(false)
  }, [clinicId, clinicName, clinicStreet, clinicNumber, clinicNeighborhood, clinicCity, clinicState, clinicEmail, clinicPhone1, clinicPhone2, clinicCnpj, clinicLogo])

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

      {role === "admin" && (
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

      {role === "admin" && (
        <div className="mt-8 rounded-lg border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Dados da Clínica</h2>
          </div>
          <div className="p-4 space-y-4">
            {/* Logo */}
              <div className="flex items-center gap-4 pb-2">
                <div className="h-20 w-20 rounded-lg border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                  {clinicLogo ? (
                    <img src={clinicLogo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium">Logo da Clínica</p>
                <label
                  htmlFor="clinicLogo"
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Escolher imagem
                </label>
                <input
                  id="clinicLogo"
                  type="file"
                  accept="image/png,image/jpeg"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = () => {
                      setCropImageSrc(reader.result as string)
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ""
                  }}
                />
                {clinicLogo && (
                  <button
                    type="button"
                    className="block text-xs text-destructive hover:underline"
                    onClick={() => setConfirmRemoveLogo(true)}
                  >
                    Remover logo
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="clinicName">Nome da Clínica</Label>
                <Input id="clinicName" value={clinicName} onChange={(e) => setClinicName(e.target.value)} placeholder="Ex: Clínica Odontológica Sorriso Perfeito" />
              </div>
              <div>
                <Label htmlFor="clinicStreet">Rua</Label>
                <Input id="clinicStreet" value={clinicStreet} onChange={(e) => setClinicStreet(e.target.value)} placeholder="Ex: Rua Augusta" />
              </div>
              <div>
                <Label htmlFor="clinicNumber">Número</Label>
                <Input id="clinicNumber" value={clinicNumber} onChange={(e) => setClinicNumber(e.target.value)} placeholder="Ex: 1500" />
              </div>
              <div>
                <Label htmlFor="clinicNeighborhood">Bairro</Label>
                <Input id="clinicNeighborhood" value={clinicNeighborhood} onChange={(e) => setClinicNeighborhood(e.target.value)} placeholder="Ex: Consolação" />
              </div>
              <div>
                <Label htmlFor="clinicCity">Cidade</Label>
                <Input id="clinicCity" value={clinicCity} onChange={(e) => setClinicCity(e.target.value)} placeholder="Ex: São Paulo" />
              </div>
              <div>
                <Label htmlFor="clinicState">Estado</Label>
                <Input id="clinicState" value={clinicState} onChange={(e) => setClinicState(e.target.value)} placeholder="Ex: SP" maxLength={2} className="uppercase" />
              </div>
              <div>
                <Label htmlFor="clinicEmail">E-mail</Label>
                <Input id="clinicEmail" type="email" value={clinicEmail} onChange={(e) => setClinicEmail(e.target.value)} placeholder="contato@clinica.com.br" />
              </div>
              <div>
                <Label htmlFor="clinicPhone1">Telefone 1</Label>
                <Input id="clinicPhone1" value={clinicPhone1} onChange={(e) => setClinicPhone1(maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <Label htmlFor="clinicPhone2">Telefone 2</Label>
                <Input id="clinicPhone2" value={clinicPhone2} onChange={(e) => setClinicPhone2(maskPhone(e.target.value))} placeholder="(11) 88888-8888" />
              </div>
              <div>
                <Label htmlFor="clinicCnpj">CNPJ</Label>
                <Input id="clinicCnpj" value={clinicCnpj} onChange={(e) => setClinicCnpj(maskCnpj(e.target.value))} placeholder="00.000.000/0001-00" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveClinic} disabled={savingClinic}>
                {savingClinic ? "Salvando..." : "Salvar Dados da Clínica"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemoveLogo}
        onOpenChange={setConfirmRemoveLogo}
        title="Remover logo"
        description="Tem certeza que deseja remover a logo da clínica?"
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => setClinicLogo(null)}
      />

      {cropImageSrc && (
        <CropDialog
          open={!!cropImageSrc}
          imageSrc={cropImageSrc}
          onCrop={(base64) => {
            setClinicLogo(base64)
            setCropImageSrc(null)
          }}
          onCancel={() => setCropImageSrc(null)}
        />
      )}
    </div>
  )
}
