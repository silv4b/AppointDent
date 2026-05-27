import { PacienteAnamneseClient } from "./client"

export default async function PacienteAnamnesePage({
  params,
}: {
  params: Promise<{ pacienteId: string }>
}) {
  const { pacienteId } = await params
  return <PacienteAnamneseClient pacienteId={pacienteId} />
}
