"use server"

import { requireAuth } from "@/lib/supabase/guard"
import { ok, err } from "@/lib/utils/action-response"
import { getUserDentistFilter } from "@/lib/utils/access-filter"
import { NULL_UUID } from "@/lib/utils/constants"

export async function getDentistsPaginated(
  page: number,
  pageSize: number,
  search?: string,
  sortColumn?: string,
  sortDir?: string,
) {
  try {
    const { supabase } = await requireAuth()
    const dentistFilter = await getUserDentistFilter()

    let query = supabase
      .from("dentists")
      .select("id, name, specialty, cro, phone, email, active, profile_id, created_at", { count: "exact" })

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        query = query.in("id", dentistFilter)
      } else {
        query = query.eq("id", NULL_UUID)
      }
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,specialty.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`,
      )
    }

    const orderCol = sortColumn ?? "name"
    const orderDir = sortDir === "desc" ? "desc" : "asc"
    query = query.order(orderCol, { ascending: orderDir === "asc" })

    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1)

    return ok({ data: data ?? [], total: count ?? 0 })
  } catch {
    return err("Erro ao carregar dentistas")
  }
}

export async function getDentistsSimpleList() {
  try {
    const { supabase } = await requireAuth()
    const dentistFilter = await getUserDentistFilter()

    let query = supabase
      .from("dentists")
      .select("id, name, active")
      .eq("active", true)
      .order("name")

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        query = query.in("id", dentistFilter)
      } else {
        query = query.eq("id", NULL_UUID)
      }
    }

    const { data } = await query
    return ok(data ?? [])
  } catch {
    return err("Erro ao carregar dentistas")
  }
}

export async function getProceduresPaginated(
  page: number,
  pageSize: number,
  search?: string,
) {
  try {
    const { supabase } = await requireAuth()

    let query = supabase
      .from("procedures")
      .select("id, name, description, duration_minutes, price, color, active, created_at", { count: "exact" })
      .order("name")

    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
    }

    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1)

    return ok({ data: data ?? [], total: count ?? 0 })
  } catch {
    return err("Erro ao carregar procedimentos")
  }
}

export async function getProceduresActiveList() {
  try {
    const { supabase } = await requireAuth()
    const { data } = await supabase
      .from("procedures")
      .select("id, name, description, duration_minutes, price, color")
      .eq("active", true)
      .order("name")
    return ok(data ?? [])
  } catch {
    return err("Erro ao carregar procedimentos")
  }
}

export async function getDashboardStats() {
  try {
    const { supabase } = await requireAuth()
    const dentistFilter = await getUserDentistFilter()

    const today = new Date().toISOString().slice(0, 10)

    let apptsQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("start_time", `${today}T00:00:00Z`)
      .lte("start_time", `${today}T23:59:59Z`)

    let recentQuery = supabase
      .from("appointments")
      .select("id, patient_id, dentist_id, procedure_id, start_time, end_time, status, patients(name), dentists(name), procedures(name, color)")
      .gte("start_time", `${today}T00:00:00Z`)
      .lte("start_time", `${today}T23:59:59Z`)
      .order("start_time")
      .limit(5)

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        apptsQuery = apptsQuery.in("dentist_id", dentistFilter)
        recentQuery = recentQuery.in("dentist_id", dentistFilter)
      } else {
        apptsQuery = apptsQuery.eq("dentist_id", NULL_UUID)
        recentQuery = recentQuery.eq("dentist_id", NULL_UUID)
      }
    }

    const [apptsCount, patientsCount, dentistsCount, proceduresCount, appts] = await Promise.all([
      apptsQuery,
      supabase.from("patients").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("dentists").select("*", { count: "exact", head: true }).eq("active", true),
      supabase.from("procedures").select("*", { count: "exact", head: true }).eq("active", true),
      recentQuery,
    ])

    return ok({
      appointmentsToday: apptsCount.count ?? 0,
      activePatients: patientsCount.count ?? 0,
      activeDentists: dentistsCount.count ?? 0,
      activeProcedures: proceduresCount.count ?? 0,
      recentAppointments: (appts.data ?? []) as Array<{
        id: string
        patients: { name: string } | null
        dentists: { name: string } | null
        procedures: { name: string; color: string | null } | null
        start_time: string
        end_time: string
        status: string
      }>,
    })
  } catch {
    return err("Erro ao carregar estatísticas")
  }
}

type RevenueByPeriod = {
  day: { revenue: number; count: number }
  week: { revenue: number; count: number }
  month: { revenue: number; count: number }
  year: { revenue: number; count: number }
  all_time: { revenue: number; count: number }
}

type TopProcedure = {
  procedure_id: string
  procedure_name: string
  color: string | null
  count: number
  total: number
}

export async function getFinancialOverview() {
  try {
    const { supabase } = await requireAuth()

    const dentistFilter = await getUserDentistFilter()

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const monthStr = todayStr.slice(0, 7)
    const yearStr = todayStr.slice(0, 4)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    const weekStartStr = weekStart.toISOString().slice(0, 10)
    const dayOfMonth = now.getDate()
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    // --- Query 1: confirmed + completed com procedure e dentista ---
    let revenueQuery = supabase
      .from("appointments")
      .select("start_time, dentist_id, procedure_id, procedures(price, name, color), dentists(name)")
      .in("status", ["confirmed", "completed"])
      .not("procedure_id", "is", null)

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        revenueQuery = revenueQuery.in("dentist_id", dentistFilter)
      } else {
        revenueQuery = revenueQuery.eq("dentist_id", NULL_UUID)
      }
    }

    // --- Query 2: contagem de cancelados (mês) ---
    let cancelledQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("start_time", `${monthStr}-01T00:00:00Z`)
      .lte("start_time", `${monthStr}-31T23:59:59Z`)

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        cancelledQuery = cancelledQuery.in("dentist_id", dentistFilter)
      } else {
        cancelledQuery = cancelledQuery.eq("dentist_id", NULL_UUID)
      }
    }

    // --- Query 3: total de agendamentos no mês (para taxa de cancelamento) ---
    let totalMonthQuery = supabase
      .from("appointments")
      .select("*", { count: "exact", head: true })
      .gte("start_time", `${monthStr}-01T00:00:00Z`)
      .lte("start_time", `${monthStr}-31T23:59:59Z`)

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        totalMonthQuery = totalMonthQuery.in("dentist_id", dentistFilter)
      } else {
        totalMonthQuery = totalMonthQuery.eq("dentist_id", NULL_UUID)
      }
    }

    const [revenueResult, cancelledResult, totalMonthResult] = await Promise.all([
      revenueQuery,
      cancelledQuery,
      totalMonthQuery,
    ])

    const appointments = (revenueResult.data ?? []) as Array<{
      start_time: string
      dentist_id: string
      procedure_id: string
      procedures: { price: number | null; name: string; color: string | null } | null
      dentists: { name: string } | null
    }>

    const totalAppointments = revenueResult.count ?? 0
    const cancelledCount = cancelledResult.count ?? 0
    const totalMonthCount = totalMonthResult.count ?? 0
    const cancellationRate = totalMonthCount > 0 ? cancelledCount / totalMonthCount : 0
    const completionRate = 1 - cancellationRate

    const priceOf = (a: (typeof appointments)[number]) => a.procedures?.price ?? 0
    const sum = (items: typeof appointments) => items.reduce((acc, a) => acc + priceOf(a), 0)

    const dayItems = appointments.filter((a) => a.start_time.slice(0, 10) === todayStr)
    const weekItems = appointments.filter((a) => a.start_time.slice(0, 10) >= weekStartStr)
    const monthItems = appointments.filter((a) => a.start_time.slice(0, 7) === monthStr)
    const yearItems = appointments.filter((a) => a.start_time.slice(0, 4) === yearStr)

    const monthRevenue = sum(monthItems)

    const revenue: RevenueByPeriod = {
      day: { revenue: sum(dayItems), count: dayItems.length },
      week: { revenue: sum(weekItems), count: weekItems.length },
      month: { revenue: monthRevenue, count: monthItems.length },
      year: { revenue: sum(yearItems), count: yearItems.length },
      all_time: { revenue: sum(appointments), count: totalAppointments },
    }

    const ticketMedio = (items: typeof appointments) =>
      items.length > 0 ? sum(items) / items.length : 0

    const ticket = {
      day: ticketMedio(dayItems),
      week: ticketMedio(weekItems),
      month: ticketMedio(monthItems),
      year: ticketMedio(yearItems),
      all_time: ticketMedio(appointments),
    }

    const previsaoMensal = dayOfMonth > 0
      ? Math.round((monthRevenue / dayOfMonth) * daysInMonth)
      : 0

    // --- Faturamento por dentista ---
    const dentistMap = new Map<string, { name: string; revenue: number; count: number }>()
    for (const a of monthItems) {
      const dName = a.dentists?.name ?? "Desconhecido"
      const existing = dentistMap.get(a.dentist_id)
      if (existing) {
        existing.revenue += priceOf(a)
        existing.count++
      } else {
        dentistMap.set(a.dentist_id, { name: dName, revenue: priceOf(a), count: 1 })
      }
    }
    const byDentist = Array.from(dentistMap.entries())
      .map(([dentist_id, val]) => ({ dentist_id, ...val }))
      .sort((a, b) => b.revenue - a.revenue)

    // --- Evolução mensal (últimos 6 meses) ---
    const monthlyEvolution: Array<{ month: string; label: string; revenue: number; count: number }> = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, "0")
      const prefix = `${y}-${m}`
      const items = appointments.filter((a) => a.start_time.slice(0, 7) === prefix)
      const names = [
        "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
        "Jul", "Ago", "Set", "Out", "Nov", "Dez",
      ]
      monthlyEvolution.push({
        month: prefix,
        label: `${names[d.getMonth()]}/${y.toString().slice(2)}`,
        revenue: sum(items),
        count: items.length,
      })
    }
    const maxMonthlyRevenue = Math.max(...monthlyEvolution.map((m) => m.revenue), 1)

    // --- Top procedures ---
    const topMap = new Map<string, { name: string; color: string | null; count: number; total: number }>()
    for (const a of appointments) {
      const pid = a.procedure_id
      const p = a.procedures
      if (!pid || !p) continue
      const existing = topMap.get(pid)
      if (existing) {
        existing.count++
        existing.total += p.price ?? 0
      } else {
        topMap.set(pid, { name: p.name, color: p.color, count: 1, total: p.price ?? 0 })
      }
    }

    const topProcedures: TopProcedure[] = Array.from(topMap.entries())
      .map(([procedure_id, val]) => ({ procedure_id, procedure_name: val.name, color: val.color, count: val.count, total: val.total }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return ok({
      revenue,
      ticket,
      cancellationRate,
      completionRate,
      cancelledCount,
      previsaoMensal,
      byDentist,
      monthlyEvolution,
      maxMonthlyRevenue,
      topProcedures,
      totalAppointments,
    })
  } catch {
    return err("Erro ao carregar dados financeiros")
  }
}

export async function getClinicHours() {
  try {
    const { supabase } = await requireAuth()
    const { data } = await supabase
      .from("clinic_hours")
      .select("day_of_week, open_time, close_time, is_open")
      .order("day_of_week")
    return ok(data ?? [])
  } catch {
    return err("Erro ao carregar horários")
  }
}

export async function getHorariosData() {
  try {
    const { supabase } = await requireAuth()
    const dentistFilter = await getUserDentistFilter()

    let slotsQuery = supabase
      .from("availability_slots")
      .select("id, dentist_id, day_of_week, start_time, end_time, slot_type, dentists(name)")
      .order("dentist_id")
      .order("day_of_week")
      .order("start_time")

    if (dentistFilter !== null) {
      if (dentistFilter.length > 0) {
        slotsQuery = slotsQuery.in("dentist_id", dentistFilter)
      } else {
        slotsQuery = slotsQuery.eq("dentist_id", NULL_UUID)
      }
    }

    let dentistsQuery = supabase
      .from("dentists")
      .select("id, name, specialty, cro, email, phone, active, created_at")
      .order("name")

    if (dentistFilter !== null && dentistFilter.length > 0) {
      dentistsQuery = dentistsQuery.in("id", dentistFilter)
    }

    const [slotsResult, dentistsResult] = await Promise.all([
      slotsQuery,
      dentistsQuery,
    ])

    return ok({
      slots: (slotsResult.data ?? []) as Array<{
        id: string
        dentist_id: string
        day_of_week: number
        start_time: string
        end_time: string
        slot_type: string
        dentists: { name: string } | null
      }>,
      dentists: dentistsResult.data ?? [],
    })
  } catch {
    return err("Erro ao carregar horários")
  }
}

export async function getMeusProcedimentosData() {
  try {
    const { supabase, user } = await requireAuth()

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    if (!profile || profile.role !== "dentist") return ok(null)

    const { data: dentist } = await supabase
      .from("dentists")
      .select("id")
      .eq("profile_id", user.id)
      .single()

    if (!dentist) return ok(null)

    const [procRes, dpRes] = await Promise.all([
      supabase.from("procedures").select("id, name, description, duration_minutes, price, color").eq("active", true).order("name"),
      supabase.from("dentist_procedures").select("id, dentist_id, procedure_id, price, duration_minutes, active").eq("dentist_id", dentist.id),
    ])

    return ok({
      dentistId: dentist.id,
      procedures: procRes.data ?? [],
      dentistProcedures: (dpRes.data ?? []) as Array<{
        id: string
        dentist_id: string
        procedure_id: string
        price: number | null
        duration_minutes: number | null
        active: boolean
      }>,
    })
  } catch {
    return err("Erro ao carregar dados")
  }
}

export async function getMinhaAgendaAppointments(params: {
  tab: "future" | "current" | "past"
  page: number
  pageSize: number
  patientSearch?: string
  procedureSearch?: string
  dateFrom?: string
  dateTo?: string
  statusFilter?: string
}) {
  try {
    const { supabase, user } = await requireAuth()
    const { tab, page, pageSize, patientSearch, procedureSearch, dateFrom, dateTo, statusFilter } = params

    const { data: dentist } = await supabase
      .from("dentists")
      .select("id")
      .eq("profile_id", user.id)
      .single()

    if (!dentist) return ok({ data: [], total: 0 })

    let patientIds: string[] | null = null
    const psTrim = patientSearch?.trim()
    if (psTrim) {
      const { data: matched } = await supabase
        .from("patients")
        .select("id")
        .ilike("name", `%${psTrim}%`)
      patientIds = matched?.map((m) => m.id) ?? []
      if (patientIds.length === 0) return ok({ data: [], total: 0 })
    }

    let procedureIds: string[] | null = null
    const prTrim = procedureSearch?.trim()
    if (prTrim) {
      const { data: matched } = await supabase
        .from("procedures")
        .select("id")
        .ilike("name", `%${prTrim}%`)
      procedureIds = matched?.map((m) => m.id) ?? []
      if (procedureIds.length === 0) return ok({ data: [], total: 0 })
    }

    const now = new Date()
    let query = supabase
      .from("appointments")
      .select("id, patient_id, dentist_id, procedure_id, start_time, end_time, status, notes, created_at, updated_at, return_to_id, patients(name), procedures(name, color, duration_minutes)", { count: "exact" })
      .eq("dentist_id", dentist.id)

    if (patientIds) query = query.in("patient_id", patientIds)
    if (procedureIds) query = query.in("procedure_id", procedureIds)
    if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter)
    if (dateFrom) query = query.gte("start_time", new Date(dateFrom + "T00:00:00").toISOString())
    if (dateTo) query = query.lte("end_time", new Date(dateTo + "T23:59:59").toISOString())

    if (tab === "future") {
      query = query.gte("start_time", now.toISOString()).order("start_time", { ascending: true })
    } else if (tab === "past") {
      query = query.lt("end_time", now.toISOString()).order("start_time", { ascending: false })
    } else {
      query = query.lte("start_time", now.toISOString()).gte("end_time", now.toISOString()).order("start_time", { ascending: true })
    }

    if (tab !== "current") {
      const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1)
      return ok({ data: data ?? [], total: count ?? 0 })
    } else {
      const { data } = await query
      return ok({ data: data ?? [], total: data?.length ?? 0 })
    }
  } catch {
    return err("Erro ao carregar agenda")
  }
}

export async function getTodayAtendimentos(params: {
  tab: "future" | "current" | "past"
  page: number
  pageSize: number
  patientSearch?: string
  procedureSearch?: string
  statusFilter?: string
}) {
  try {
    const { supabase, user } = await requireAuth()
    const { tab, page, pageSize, patientSearch, procedureSearch, statusFilter } = params

    const { data: dentist } = await supabase
      .from("dentists")
      .select("id")
      .eq("profile_id", user.id)
      .single()

    if (!dentist) return ok({ data: [], total: 0 })

    let patientIds: string[] | null = null
    const psTrim = patientSearch?.trim()
    if (psTrim) {
      const { data: matched } = await supabase
        .from("patients")
        .select("id")
        .ilike("name", `%${psTrim}%`)
      patientIds = matched?.map((m) => m.id) ?? []
      if (patientIds.length === 0) return ok({ data: [], total: 0 })
    }

    let procedureIds: string[] | null = null
    const prTrim = procedureSearch?.trim()
    if (prTrim) {
      const { data: matched } = await supabase
        .from("procedures")
        .select("id")
        .ilike("name", `%${prTrim}%`)
      procedureIds = matched?.map((m) => m.id) ?? []
      if (procedureIds.length === 0) return ok({ data: [], total: 0 })
    }

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const dayStart = `${todayStr}T00:00:00Z`
    const dayEnd = `${todayStr}T23:59:59Z`

    let query = supabase
      .from("appointments")
      .select("id, patient_id, dentist_id, procedure_id, start_time, end_time, status, notes, started_at, finished_at, created_at, updated_at, return_to_id, patients(name), procedures(name, color, duration_minutes)", { count: "exact" })
      .eq("dentist_id", dentist.id)
      .gte("start_time", dayStart)
      .lte("start_time", dayEnd)

    if (patientIds) query = query.in("patient_id", patientIds)
    if (procedureIds) query = query.in("procedure_id", procedureIds)
    if (statusFilter && statusFilter !== "all") query = query.eq("status", statusFilter)

    if (tab === "future") {
      query = query.in("status", ["scheduled", "confirmed"]).order("start_time", { ascending: true })
    } else if (tab === "past") {
      query = query.in("status", ["completed", "cancelled"]).order("start_time", { ascending: false })
    } else {
      query = query.eq("status", "in_progress").order("start_time", { ascending: true })
    }

    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1)
    return ok({ data: data ?? [], total: count ?? 0 })
  } catch {
    return err("Erro ao carregar atendimentos")
  }
}

export async function getAnamnesePatientsList(params: {
  page: number
  pageSize: number
  search?: string
  dentistFilter?: string
}) {
  try {
    const { supabase } = await requireAuth()
    const { page, pageSize, search, dentistFilter } = params
    const dentistFilterObj = await getUserDentistFilter()

    let patientIds: string[] | null = null
    const filter = dentistFilter ?? "all"
    if (filter !== "all") {
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("dentist_id", filter)
      patientIds = [...new Set((appts ?? []).map((a) => a.patient_id))]
    } else if (dentistFilterObj !== null && dentistFilterObj.length > 0) {
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_id")
        .in("dentist_id", dentistFilterObj)
      patientIds = [...new Set((appts ?? []).map((a) => a.patient_id))]
    } else if (dentistFilterObj !== null) {
      patientIds = []
    }

    let queryBuilder = supabase
      .from("patients")
      .select("id, name, cpf, phone, email, birth_date, notes, active", { count: "exact" })
      .order("name")

    if (patientIds !== null) {
      if (patientIds.length === 0) return ok({ data: [], total: 0 })
      queryBuilder = queryBuilder.in("id", patientIds)
    }

    if (search?.trim()) {
      queryBuilder = queryBuilder.ilike("name", `%${search.trim()}%`)
    }

    const { data, count } = await queryBuilder.range(
      (page - 1) * pageSize,
      page * pageSize - 1,
    )

    return ok({ data: data ?? [], total: count ?? 0 })
  } catch {
    return err("Erro ao carregar pacientes")
  }
}

export async function getHistoricoPatientsList(params: {
  page: number
  pageSize: number
  search?: string
  dentistFilter?: string
}) {
  try {
    const { supabase } = await requireAuth()
    const { page, pageSize, search, dentistFilter } = params
    const dentistFilterObj = await getUserDentistFilter()

    let patientIds: string[] | null = null
    const filter = dentistFilter ?? "all"
    if (filter !== "all") {
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_id")
        .eq("dentist_id", filter)
      patientIds = [...new Set((appts ?? []).map((a) => a.patient_id))]
    } else if (dentistFilterObj !== null && dentistFilterObj.length > 0) {
      const { data: appts } = await supabase
        .from("appointments")
        .select("patient_id")
        .in("dentist_id", dentistFilterObj)
      patientIds = [...new Set((appts ?? []).map((a) => a.patient_id))]
    } else if (dentistFilterObj !== null) {
      patientIds = []
    }

    let queryBuilder = supabase
      .from("patients")
      .select("id, name, cpf, phone, email, birth_date, notes, active", { count: "exact" })
      .order("name")

    if (patientIds !== null) {
      if (patientIds.length === 0) return ok({ data: [], total: 0 })
      queryBuilder = queryBuilder.in("id", patientIds)
    }

    if (search?.trim()) {
      queryBuilder = queryBuilder.ilike("name", `%${search.trim()}%`)
    }

    const { data, count } = await queryBuilder.range(
      (page - 1) * pageSize,
      page * pageSize - 1,
    )

    return ok({ data: data ?? [], total: count ?? 0 })
  } catch {
    return err("Erro ao carregar pacientes")
  }
}

export async function searchPatientsByName(search: string) {
  try {
    const { supabase } = await requireAuth()
    if (!search.trim()) return ok([])
    const { data } = await supabase
      .from("patients")
      .select("id, name, phone")
      .ilike("name", `%${search}%`)
      .order("name")
      .limit(10)
    return ok(data ?? [])
  } catch {
    return err("Erro ao buscar pacientes")
  }
}

export async function getAnamneseSessionByAppointment(appointmentId: string) {
  try {
    const { supabase } = await requireAuth()
    const { data } = await supabase
      .from("anamnese_sessions")
      .select("title, fields, notes, created_at, dentists(name)")
      .eq("appointment_id", appointmentId)
      .single()
    return ok(data ?? null)
  } catch {
    return err("Erro ao carregar anamnese")
  }
}

export async function getPatientName(patientId: string) {
  try {
    const { supabase } = await requireAuth()
    const { data } = await supabase
      .from("patients")
      .select("id, name")
      .eq("id", patientId)
      .single()
    return ok(data ?? null)
  } catch {
    return err("Erro ao carregar paciente")
  }
}
