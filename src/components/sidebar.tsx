"use client"

import { useState } from "react"
import { logout } from "@/lib/supabase/actions"
import { cn } from "@/lib/utils"
import { useSupabase } from "@/components/providers/supabase-provider"
import {
  Calendar,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  LayoutDashboard,
  LogOut,
  Stethoscope,
  Syringe,
  Users,
  X,
  Menu,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
}

type NavSection = {
  label: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/agenda", label: "Agenda", icon: Calendar },
    ],
  },
  {
    label: "Cadastros",
    items: [
      { href: "/pacientes", label: "Pacientes", icon: Users },
      { href: "/dentistas", label: "Dentistas", icon: Stethoscope },
      { href: "/procedimentos", label: "Procedimentos", icon: Syringe },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/horarios", label: "Grade de Horários", icon: Clock },
    ],
  },
]

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }
  if (email) {
    return email[0].toUpperCase()
  }
  return "U"
}

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { user } = useSupabase()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userName = user?.user_metadata?.name as string | undefined
  const userEmail = user?.email ?? null
  const initials = getInitials(userName, userEmail)

  function NavItem({ href, label, icon: Icon }: NavItem) {
    const isActive = pathname === href
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-primary"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
          collapsed && "justify-center px-2",
        )}
        title={collapsed ? label : undefined}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    )
  }

  const sidebarContent = (
    <>
      <div className={cn(
        "flex h-16 shrink-0 items-center border-b border-sidebar-border px-4",
        collapsed ? "justify-center px-0" : "gap-3",
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
          <Syringe className="h-4 w-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <>
            <span className="truncate text-sm font-bold tracking-tight text-sidebar-foreground">
              Odonto
            </span>
            <span className="hidden truncate text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40 sm:block">
              Schedule
            </span>
          </>
        )}
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
        {navSections.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                {section.label}
              </div>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {!collapsed && (
        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {userName ?? userEmail ?? "Usuário"}
              </p>
              {userEmail && (
                <p className="truncate text-xs text-sidebar-foreground/60">
                  {userEmail}
                </p>
              )}
            </div>
          </div>
          <form action={logout} className="mt-2">
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      )}

      {collapsed && (
        <div className="border-t border-sidebar-border p-2">
          <form action={logout}>
            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-lg px-2 py-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      <div className={cn(
        "border-t border-sidebar-border",
        collapsed ? "p-2" : "p-3",
      )}>
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            "flex w-full items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
            collapsed ? "px-2 py-2" : "gap-3 px-3 py-2 text-sm font-medium",
          )}
          title={collapsed ? "Expandir" : "Recolher"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed && <span>Recolher</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      <button
        type="button"
        className="fixed left-4 top-3 z-50 flex size-9 items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground shadow-lg transition-colors hover:bg-sidebar-accent lg:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full flex-col bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        {mobileOpen && (
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary">
                <Syringe className="h-4 w-4 text-sidebar-primary-foreground" />
              </div>
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">Odonto</span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-foreground/40">Schedule</span>
            </div>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {mobileOpen ? (
          <>
            <nav className="flex-1 space-y-3 overflow-y-auto px-3 py-4">
              {navSections.map((section) => (
                <div key={section.label}>
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                    {section.label}
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item) => (
                      <NavItem key={item.href} {...item} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="border-t border-sidebar-border p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-medium text-sidebar-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {userName ?? userEmail ?? "Usuário"}
                  </p>
                  {userEmail && (
                    <p className="truncate text-xs text-sidebar-foreground/60">{userEmail}</p>
                  )}
                </div>
              </div>
              <form action={logout} className="mt-2">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </button>
              </form>
            </div>
          </>
        ) : (
          sidebarContent
        )}
      </aside>
    </>
  )
}
