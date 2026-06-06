import { getUserSessionData } from "@/lib/actions/session"
import { HorariosClient } from "./client"

export const metadata = { title: "Grade de Horários" }

export default async function HorariosPage() {
  const session = await getUserSessionData()
  const role = "data" in session ? session.data.role : null

  return <HorariosClient role={role} />
}
