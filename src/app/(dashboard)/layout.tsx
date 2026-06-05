"use client"

import { useEffect, useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { useLocalStorage } from "@/hooks/use-local-storage"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useLocalStorage("sidebar:collapsed", false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024)
    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      <div
        className="flex flex-col transition-all duration-300"
        style={{ marginLeft: isMobile ? 0 : (collapsed ? 64 : 272) }}
      >
        <DashboardHeader collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
        <main className="flex-1 p-4 sm:p-6">
          <div className="space-y-6 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  )
}
