import { PacienteDetailClient } from "./client"

export const metadata = { title: "Histórico" }

export default async function PacienteDetailPage(props: { params: Promise<{ pacienteId: string }> }) {
  const { pacienteId } = await props.params
  return <PacienteDetailClient pacienteId={pacienteId} />
}
